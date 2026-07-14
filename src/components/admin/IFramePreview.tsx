import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function IFramePreview({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    // Inject Tailwind and custom styles here if needed
    // But since the main document already has all the styles, we can just copy them over!
    const styleTags = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'));
    styleTags.forEach(tag => {
      doc.head.appendChild(tag.cloneNode(true));
    });

    // Add inter font if needed
    const fontLink = doc.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    doc.head.appendChild(fontLink);

    // Create mount point
    let rootNode = doc.getElementById('iframe-root');
    if (!rootNode) {
      rootNode = doc.createElement('div');
      rootNode.id = 'iframe-root';
      doc.body.appendChild(rootNode);
    }
    
    // Copy body classes
    doc.body.className = document.body.className;
    
    setMountNode(rootNode);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      className={className}
      style={{ ...style, border: 'none' }}
      title="Responsive Preview"
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}
