import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { 
  DndContext, 
  closestCenter, 
  TouchSensor, 
  MouseSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item UI ---
const SortableItem = ({ file, onRemove }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: file.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? '#eefaff' : 'white',
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '8px',
    border: isDragging ? '2px solid #92d050' : '1px solid #0070c0',
    display: 'flex',
    alignItems: 'center',
    boxShadow: isDragging ? '0 8px 15px rgba(0,0,0,0.2)' : '0 2px 5px rgba(0,0,0,0.1)',
    zIndex: isDragging ? 10 : 1,
    touchAction: 'none' 
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ marginRight: '15px', color: '#0070c0', fontSize: '18px' }}>☰</div>
      <div style={{ flex: 1, fontSize: '13px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {file.name}
      </div>
      <button 
        onPointerDown={(e) => e.stopPropagation()} 
        onClick={() => onRemove(file.id)} 
        style={{ background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  );
};

export default function MergePDF() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  const handleFileChange = (e: any) => {
    const newFiles = Array.from(e.target.files).map((file: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Internal Helper to Merge PDFs
  const getMergedFile = async () => {
    const mergedPdf = await PDFDocument.create();
    for (const f of files) {
      const bytes = await f.file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }
    const pdfBytes = await mergedPdf.save();
    const fileName = `Merged_UniqDesigns_${Date.now()}.pdf`;
    return new File([pdfBytes], fileName, { type: 'application/pdf' });
  };

  // ACTION 1: Direct Download
  const handleDownload = async () => {
    if (files.length < 2) return alert("Select at least 2 files!");
    setLoading(true);
    try {
      const file = await getMergedFile();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.click();
    } catch (err) {
      alert("Error generating PDF.");
    }
    setLoading(false);
  };

  // ACTION 2: Share to WhatsApp/System
  const handleShare = async () => {
    if (files.length < 2) return alert("Select at least 2 files!");
    setLoading(true);
    try {
      const file = await getMergedFile();
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Uniq Designs PDF',
          text: 'Shared from Uniq Designs PDF Tool',
        });
      } else {
        alert("Sharing not supported on this browser. Try Download instead.");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f9f9f9', userSelect: 'none' }}>
      <header style={{ backgroundColor: '#92d050', padding: '15px', textAlign: 'center', fontWeight: '900', borderBottom: '3px solid #76b041' }}>
        MERGE PDF - UNIQ DESIGNS
      </header>
      
      <div style={{ padding: '15px' }}>
        <label style={{ display: 'block', padding: '30px', border: '2px dashed #0070c0', textAlign: 'center', borderRadius: '10px', backgroundColor: '#eefaff', cursor: 'pointer', marginBottom: '15px' }}>
          <input type="file" multiple accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
          <span style={{ fontWeight: 'bold', color: '#0070c0' }}>+ Upload PDF Files</span>
        </label>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {files.map(f => (
              <SortableItem key={f.id} file={f} onRemove={(id: any) => setFiles(files.filter(x => x.id !== id))} />
            ))}
          </SortableContext>
        </DndContext>

        {files.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ backgroundColor: '#ffff00', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '5px', border: '1px solid #e6e600' }}>
              Files to Merge: {files.length}
            </div>
            
            {/* DOWNLOAD BUTTON (BLUE) */}
            <button 
              onClick={handleDownload} 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                backgroundColor: '#0070c0', 
                color: 'white', 
                border: 'none', 
                borderRadius: '10px', 
                fontWeight: '900', 
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,112,192,0.3)'
              }}
            >
              {loading ? "GENERATING..." : "DOWNLOAD MERGED PDF"}
            </button>

            {/* WHATSAPP/SHARE BUTTON (GREEN) */}
            <button 
              onClick={handleShare} 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                backgroundColor: '#25D366', 
                color: 'white', 
                border: 'none', 
                borderRadius: '10px', 
                fontWeight: '900', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 10px rgba(37,211,102,0.3)'
              }}
            >
              {loading ? "PREPARING..." : "SEND VIA WHATSAPP"}
            </button>
            
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#888', marginTop: '5px' }}>
              Hold & drag to reorder files.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
