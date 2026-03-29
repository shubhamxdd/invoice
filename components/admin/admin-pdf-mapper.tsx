"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2, Crosshair, Plus, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

// Setup worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

interface Field {
  key: string;
  label: string;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface AdminPdfMapperProps {
  file: string; // URL or path
  fields: Field[];
  onFieldsChange: (fields: Field[]) => void;
  selectedKey?: string;
  onSelectKey: (key: string) => void;
}

export function AdminPdfMapper({ file, fields, onFieldsChange, selectedKey, onSelectKey }: AdminPdfMapperProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.2);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
        if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handlePageClick = (e: React.MouseEvent, pageNum: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Add a new "Untitled" field at this coordinate
    const newField: Field = {
        key: `field_${Date.now()}`,
        label: "New Field",
        page: pageNum,
        x: x, // percentage
        y: y, // percentage
    };
    onFieldsChange([...fields, newField]);
    onSelectKey(newField.key);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner" ref={containerRef}>
      <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 italic">Neural Mapper Active</span>
        </div>
        <div className="flex gap-2">
            <button 
                className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center font-black hover:bg-gray-100"
                onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            >-</button>
            <span className="text-[10px] font-black w-10 text-center flex items-center justify-center">{(scale * 100).toFixed(0)}%</span>
            <button 
                className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center font-black hover:bg-gray-100"
                onClick={() => setScale(s => Math.min(3, s + 0.1))}
            >+</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-96 py-20 px-40">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Neural Base...</p>
            </div>
          }
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} className="relative mb-8 shadow-2xl rounded-2xl overflow-hidden group">
              <Page
                pageNumber={index + 1}
                scale={scale}
                className="shadow-inner"
                onClick={(e) => handlePageClick(e, index + 1)}
              />
              
              {/* Overlays */}
              <div className="absolute inset-0 pointer-events-none">
                {fields.filter(f => f.page === index + 1).map((field) => (
                  <div
                    key={field.key}
                    style={{
                      left: `${field.x * 100}%`,
                      top: `${field.y * 100}%`,
                      width: '20px', // or field.width
                      height: '20px', // or field.height
                    }}
                    className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-pointer transition-all",
                        selectedKey === field.key ? "z-20 scale-125 shake-subtle" : "z-10 h-4 w-4"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectKey(field.key);
                    }}
                  >
                        <div className={cn(
                            "h-4 w-4 rounded-full border-2 bg-white transition-all shadow-xl",
                            selectedKey === field.key ? "border-indigo-600 scale-125 ring-4 ring-indigo-100" : "border-gray-400 opacity-60 hover:opacity-100"
                        )} />
                        {selectedKey === field.key && (
                            <div className="absolute -top-10 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                                {field.label || "Unnamed"}
                            </div>
                        )}
                  </div>
                ))}
              </div>

              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Page {index + 1}
              </div>
            </div>
          ))}
        </Document>
      </div>

      <div className="p-6 bg-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Neural Calibration</p>
                  <p className="text-xs font-bold leading-relaxed">Click any area on the document to "anchor" a new data extraction point. The system will learn to find similar fields in all bank variants.</p>
              </div>
          </div>
      </div>
    </div>
  );
}
