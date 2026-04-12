import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Drag & Drop Item UI
const SortableItem = ({ file, onRemove }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: 'white',
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '8px',
    border: '1px solid #0070c0',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} style={{ cursor: 'grab', marginRight: '15px', color: '#0070c0' }}>☰</div>
      <div style={{ flex: 1, fontSize: '13px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
      <button onClick={() => onRemove(file.id)} style={{ background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}>×</button>
    </div>
  );
};

export default function MergePDF() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

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

  const mergePDFs = async () => {
    if (files.length < 2) return alert("Select at least 2 files!");
    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const f of files) {
        const bytes = await f.file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "Merged_Document.pdf";
      link.click();
    } catch (err) { alert("Error merging files"); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
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
            {files.map(f => <SortableItem key={f.id} file={f} onRemove={(id: any) => setFiles(files.filter(x => x.id !== id))} />)}
          </SortableContext>
        </DndContext>

        {files.length > 0 && (
          <>
            <div style={{ backgroundColor: '#ffff00', padding: '10px', textAlign: 'center', fontWeight: 'bold', marginBottom: '10px', borderRadius: '5px' }}>
              Files to Merge: {files.length}
            </div>
            <button onClick={mergePDFs} disabled={loading} style={{ width: '100%', padding: '15px', backgroundColor: '#0070c0', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
              {loading ? "PROCESSING..." : "DOWNLOAD MERGED PDF"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
