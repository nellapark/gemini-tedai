import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResult } from '../types';

// Helper to create visual diagrams using canvas
const createDiagramCanvas = (width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    drawFn(ctx);
  }
  return canvas.toDataURL('image/png');
};

// Create urgency indicator diagram
const createUrgencyDiagram = (urgency: string): string => {
  return createDiagramCanvas(600, 150, (ctx) => {
    const levels = ['Low', 'Medium', 'High', 'Critical'];
    const colors = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
    const currentIndex = levels.indexOf(urgency);
    
    // Draw urgency bar
    levels.forEach((level, i) => {
      const x = 50 + (i * 130);
      const isActive = i <= currentIndex;
      
      // Draw rounded rectangle
      ctx.fillStyle = isActive ? colors[i] : '#e5e7eb';
      ctx.beginPath();
      ctx.roundRect(x, 40, 110, 60, 10);
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = isActive ? '#ffffff' : '#6b7280';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(level, x + 55, 75);
      
      // Draw connecting arrow if not last
      if (i < levels.length - 1) {
        ctx.fillStyle = i < currentIndex ? colors[i + 1] : '#d1d5db';
        ctx.beginPath();
        ctx.moveTo(x + 110, 70);
        ctx.lineTo(x + 130, 70);
        ctx.lineTo(x + 125, 60);
        ctx.moveTo(x + 130, 70);
        ctx.lineTo(x + 125, 80);
        ctx.stroke();
      }
    });
    
    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Urgency Level Assessment', 300, 25);
  });
};

// Create severity meter diagram
const createSeverityMeter = (severity: string): string => {
  return createDiagramCanvas(400, 200, (ctx) => {
    const severityLevels = { 'Minor': 25, 'Moderate': 50, 'Major': 75, 'Severe': 100 };
    const value = severityLevels[severity as keyof typeof severityLevels] || 0;
    
    // Draw background arc
    ctx.lineWidth = 30;
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(200, 150, 100, Math.PI, 2 * Math.PI);
    ctx.stroke();
    
    // Draw colored arc based on severity
    const endAngle = Math.PI + (value / 100) * Math.PI;
    const gradient = ctx.createLinearGradient(100, 150, 300, 150);
    if (value <= 25) {
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#10b981');
    } else if (value <= 50) {
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#f59e0b');
    } else if (value <= 75) {
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(1, '#f97316');
    } else {
      gradient.addColorStop(0, '#f97316');
      gradient.addColorStop(1, '#ef4444');
    }
    
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.arc(200, 150, 100, Math.PI, endAngle);
    ctx.stroke();
    
    // Draw center text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(severity, 200, 145);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Severity Level', 200, 170);
    
    // Draw labels
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#10b981';
    ctx.fillText('Minor', 80, 175);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('Severe', 320, 175);
  });
};

// Create affected areas diagram
const createAffectedAreasDiagram = (areas: string[]): string => {
  return createDiagramCanvas(600, Math.max(300, areas.length * 60 + 100), (ctx) => {
    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Affected Areas', 300, 40);
    
    // Draw house icon
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#f3f4f6';
    
    // House body
    ctx.fillRect(220, 120, 160, 120);
    ctx.strokeRect(220, 120, 160, 120);
    
    // Roof
    ctx.beginPath();
    ctx.moveTo(200, 120);
    ctx.lineTo(300, 70);
    ctx.lineTo(400, 120);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Door
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(280, 180, 40, 60);
    
    // Windows
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(240, 140, 30, 30);
    ctx.fillRect(330, 140, 30, 30);
    
    // List areas with icons
    areas.forEach((area, i) => {
      const y = 80 + (i * 45);
      const x = 450;
      
      // Draw alert icon
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', x, y + 6);
      
      // Draw area text
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(area, x + 20, y + 5);
    });
  });
};

// Create task breakdown visual
const createTaskBreakdownDiagram = (tasks: any[]): string => {
  const height = Math.max(400, tasks.length * 80 + 100);
  return createDiagramCanvas(700, height, (ctx) => {
    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Task Breakdown & Priority', 350, 40);
    
    const priorityColors = {
      'Required': '#ef4444',
      'Recommended': '#f59e0b',
      'Optional': '#3b82f6'
    };
    
    tasks.forEach((task, i) => {
      const y = 80 + (i * 75);
      const color = priorityColors[task.priority as keyof typeof priorityColors] || '#6b7280';
      
      // Draw task number circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(50, y + 20, 25, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((i + 1).toString(), 50, y + 27);
      
      // Draw task box
      ctx.fillStyle = '#f9fafb';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(90, y, 580, 60, 8);
      ctx.fill();
      ctx.stroke();
      
      // Task name
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(task.task, 110, y + 25);
      
      // Priority badge
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(550, y + 10, 100, 25, 12);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(task.priority, 600, y + 27);
      
      // Description (truncated)
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      const desc = task.description.substring(0, 70) + (task.description.length > 70 ? '...' : '');
      ctx.fillText(desc, 110, y + 45);
    });
  });
};

// Create materials checklist visual
const createMaterialsChecklist = (materials: string[]): string => {
  const height = Math.max(300, Math.ceil(materials.length / 2) * 50 + 100);
  return createDiagramCanvas(700, height, (ctx) => {
    // Title with icon
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Materials & Equipment Required', 350, 40);
    
    // Draw materials in two columns
    materials.forEach((material, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 50 + (col * 350);
      const y = 80 + (row * 45);
      
      // Checkbox
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 20, 20);
      
      // Checkmark
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 10);
      ctx.lineTo(x + 8, y + 15);
      ctx.lineTo(x + 16, y + 5);
      ctx.stroke();
      
      // Material text
      ctx.fillStyle = '#1f2937';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(material, x + 30, y + 15);
    });
  });
};

// Create safety hazards warning diagram
const createSafetyDiagram = (hazards: string[]): string => {
  const height = Math.max(300, hazards.length * 60 + 120);
  return createDiagramCanvas(700, height, (ctx) => {
    // Warning header
    ctx.fillStyle = '#fee2e2';
    ctx.fillRect(0, 0, 700, 80);
    
    // Warning triangle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(60, 25);
    ctx.lineTo(50, 45);
    ctx.lineTo(70, 45);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('!', 60, 42);
    
    // Title
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('SAFETY HAZARDS', 90, 50);
    
    // List hazards
    hazards.forEach((hazard, i) => {
      const y = 110 + (i * 55);
      
      // Hazard box
      ctx.fillStyle = '#fef2f2';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(30, y, 640, 45, 8);
      ctx.fill();
      ctx.stroke();
      
      // Warning icon
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(60, y + 22, 15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', 60, y + 28);
      
      // Hazard text
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      const lines = hazard.match(/.{1,80}/g) || [hazard];
      lines.forEach((line, li) => {
        ctx.fillText(line, 90, y + 20 + (li * 18));
      });
    });
  });
};

export async function generateScopeOfWorkPDF(
  result: AnalysisResult,
  annotatedImages: Array<{ url: string; annotation: string }>
): Promise<Blob> {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Helper function to sanitize text - remove non-English characters
  const sanitizeText = (text: string): string => {
    if (!text) return '';
    // Keep only ASCII printable characters, newlines, and tabs
    return text.replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
  };

  // Helper function to add new page if needed
  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // ========== COVER PAGE ==========
  // Gradient background effect
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 100, 'F');
  
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 60, pageWidth, 40, 'F');
  
  // Title
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SCOPE OF WORK', pageWidth / 2, 50, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Analysis Report', pageWidth / 2, 70, { align: 'center' });
  
  // Category badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 120, pageWidth - 2 * margin, 40, 5, 5, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizeText(result.category), pageWidth / 2, 145, { align: 'center' });
  
  if (result.subcategory) {
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(sanitizeText(result.subcategory), pageWidth / 2, 155, { align: 'center' });
  }
  
  yPosition = 180;
  
  // Key info boxes
  const boxWidth = (pageWidth - 3 * margin) / 2;
  
  // Severity box
  doc.setFillColor(239, 68, 68);
  doc.roundedRect(margin, yPosition, boxWidth, 30, 5, 5, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SEVERITY', margin + 10, yPosition + 12);
  doc.setFontSize(18);
  doc.text(sanitizeText(result.severity || 'N/A'), margin + 10, yPosition + 25);
  
  // Urgency box
  const urgencyColor = result.urgency === 'Critical' || result.urgency === 'High' ? [239, 68, 68] : [245, 158, 11];
  doc.setFillColor(urgencyColor[0], urgencyColor[1], urgencyColor[2]);
  doc.roundedRect(margin + boxWidth + margin, yPosition, boxWidth, 30, 5, 5, 'F');
  doc.setFontSize(12);
  doc.text('URGENCY', margin + boxWidth + margin + 10, yPosition + 12);
  doc.setFontSize(18);
  doc.text(sanitizeText(result.urgency), margin + boxWidth + margin + 10, yPosition + 25);
  
  // Date and footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
  doc.text('Powered by QuoteScout AI', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // ========== PAGE 2: VISUAL DASHBOARDS ==========
  doc.addPage();
  yPosition = 20;
  
  // Add urgency diagram
  const urgencyDiagram = createUrgencyDiagram(result.urgency);
  doc.addImage(urgencyDiagram, 'PNG', margin, yPosition, pageWidth - 2 * margin, 40);
  yPosition += 50;
  
  // Add severity meter
  const severityMeter = createSeverityMeter(result.severity || 'Moderate');
  doc.addImage(severityMeter, 'PNG', pageWidth / 2 - 50, yPosition, 100, 50);
  yPosition += 60;
  
  // Problem Summary Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 50, 5, 5, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.text('PROBLEM SUMMARY', margin + 5, yPosition + 10);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(sanitizeText(result.problemSummary), pageWidth - 2 * margin - 10);
  doc.text(summaryLines, margin + 5, yPosition + 22);
  
  // ========== PAGE 3: AFFECTED AREAS ==========
  if (result.affectedAreas && result.affectedAreas.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    const sanitizedAreas = result.affectedAreas.map(area => sanitizeText(area));
    const areasDiagram = createAffectedAreasDiagram(sanitizedAreas);
    doc.addImage(areasDiagram, 'PNG', margin, yPosition, pageWidth - 2 * margin, Math.min(100, result.affectedAreas.length * 15 + 80));
  }
  
  // ========== PAGE 4: TASK BREAKDOWN ==========
  if (result.scopeOfWork?.requiredTasks && result.scopeOfWork.requiredTasks.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    const sanitizedTasks = result.scopeOfWork.requiredTasks.slice(0, 5).map(task => ({
      ...task,
      task: sanitizeText(task.task),
      description: sanitizeText(task.description),
      priority: sanitizeText(task.priority)
    }));
    const taskDiagram = createTaskBreakdownDiagram(sanitizedTasks);
    const diagramHeight = Math.min(pageHeight - 40, result.scopeOfWork.requiredTasks.length * 20 + 50);
    doc.addImage(taskDiagram, 'PNG', margin, yPosition, pageWidth - 2 * margin, diagramHeight);
  }
  
  // ========== PAGE 5: MATERIALS ==========
  if (result.scopeOfWork?.materialsNeeded && result.scopeOfWork.materialsNeeded.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    const sanitizedMaterials = result.scopeOfWork.materialsNeeded.map(material => sanitizeText(material));
    const materialsDiagram = createMaterialsChecklist(sanitizedMaterials);
    const materialsHeight = Math.min(pageHeight - 40, Math.ceil(result.scopeOfWork.materialsNeeded.length / 2) * 12 + 50);
    doc.addImage(materialsDiagram, 'PNG', margin, yPosition, pageWidth - 2 * margin, materialsHeight);
    
    yPosition += materialsHeight + 20;
    
    // Estimated Duration box
    if (result.scopeOfWork.estimatedDuration) {
      checkPageBreak(50);
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 35, 5, 5, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTIMATED DURATION', margin + 10, yPosition + 15);
      
      doc.setFontSize(20);
      doc.text(sanitizeText(result.scopeOfWork.estimatedDuration), margin + 10, yPosition + 30);
    }
  }
  
  // ========== PAGE 6: SAFETY HAZARDS ==========
  if (result.safetyHazards && result.safetyHazards.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    const sanitizedHazards = result.safetyHazards.map(hazard => sanitizeText(hazard));
    const safetyDiagram = createSafetyDiagram(sanitizedHazards);
    const safetyHeight = Math.min(pageHeight - 40, result.safetyHazards.length * 15 + 80);
    doc.addImage(safetyDiagram, 'PNG', margin, yPosition, pageWidth - 2 * margin, safetyHeight);
  }
  
  // ========== ANNOTATED IMAGES PAGES ==========
  if (annotatedImages.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    // Title page for images
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('VISUAL DOCUMENTATION', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('AI-Analyzed Images with Professional Annotations', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    for (const image of annotatedImages) {
      checkPageBreak(140);
      
      try {
        // Image border
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(2);
        doc.rect(margin - 2, yPosition - 2, pageWidth - 2 * margin + 4, 84);
        
        // Add image
        doc.addImage(image.url, 'JPEG', margin, yPosition, pageWidth - 2 * margin, 80);
        yPosition += 85;
        
        // Annotation box
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 40, 5, 5, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        // Sanitize annotation text to remove non-English characters
        const annotationLines = doc.splitTextToSize(sanitizeText(image.annotation), pageWidth - 2 * margin - 10);
        doc.text(annotationLines.slice(0, 4), margin + 5, yPosition + 8);
        yPosition += 50;
        
        checkPageBreak(0);
      } catch (err) {
        console.error('Error adding image to PDF:', err);
      }
    }
  }
  
  // ========== PAGE: ISSUE HISTORY & CONTEXT ==========
  if (result.issueHistory || result.userTimeline || result.userConcerns || result.environmentalFactors) {
    doc.addPage();
    yPosition = 20;
    
    // Page Title
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text('ISSUE CONTEXT & TIMELINE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Issue History
    if (result.issueHistory) {
      checkPageBreak(60);
      
      doc.setFillColor(238, 242, 255);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.text('ISSUE HISTORY', margin + 5, yPosition + 7);
      yPosition += 15;
      
      if (result.issueHistory.whenStarted) {
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'bold');
        doc.text('When It Started:', margin + 5, yPosition);
        doc.setFont('helvetica', 'normal');
        const whenLines = doc.splitTextToSize(sanitizeText(result.issueHistory.whenStarted), pageWidth - 2 * margin - 15);
        doc.text(whenLines, margin + 5, yPosition + 6);
        yPosition += (whenLines.length * 5) + 8;
      }
      
      if (result.issueHistory.howItHappened) {
        checkPageBreak(30);
        doc.setFont('helvetica', 'bold');
        doc.text('How It Happened:', margin + 5, yPosition);
        doc.setFont('helvetica', 'normal');
        const howLines = doc.splitTextToSize(sanitizeText(result.issueHistory.howItHappened), pageWidth - 2 * margin - 15);
        doc.text(howLines, margin + 5, yPosition + 6);
        yPosition += (howLines.length * 5) + 8;
      }
      
      if (result.issueHistory.previousAttempts && result.issueHistory.previousAttempts.length > 0) {
        checkPageBreak(30);
        doc.setFont('helvetica', 'bold');
        doc.text('Previous Fix Attempts:', margin + 5, yPosition);
        yPosition += 6;
        doc.setFont('helvetica', 'normal');
        result.issueHistory.previousAttempts.forEach(attempt => {
          checkPageBreak(15);
          const attemptLines = doc.splitTextToSize('- ' + sanitizeText(attempt), pageWidth - 2 * margin - 20);
          doc.text(attemptLines, margin + 10, yPosition);
          yPosition += (attemptLines.length * 5) + 3;
        });
      }
      
      yPosition += 10;
    }
    
    // User Timeline
    if (result.userTimeline) {
      checkPageBreak(60);
      
      doc.setFillColor(207, 250, 254);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(8, 145, 178);
      doc.setFont('helvetica', 'bold');
      doc.text('TIMELINE & SCHEDULING', margin + 5, yPosition + 7);
      yPosition += 15;
      
      if (result.userTimeline.desiredCompletionDate) {
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'bold');
        doc.text('Desired Completion:', margin + 5, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(8, 145, 178);
        doc.text(sanitizeText(result.userTimeline.desiredCompletionDate), margin + 5, yPosition + 8);
        yPosition += 20;
      }
      
      if (result.userTimeline.schedulingConstraints && result.userTimeline.schedulingConstraints.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'bold');
        doc.text('Scheduling Constraints:', margin + 5, yPosition);
        yPosition += 6;
        doc.setFont('helvetica', 'normal');
        result.userTimeline.schedulingConstraints.forEach(constraint => {
          checkPageBreak(15);
          const constraintLines = doc.splitTextToSize('- ' + sanitizeText(constraint), pageWidth - 2 * margin - 20);
          doc.text(constraintLines, margin + 10, yPosition);
          yPosition += (constraintLines.length * 5) + 3;
        });
      }
      
      yPosition += 10;
    }
    
    // User Concerns
    if (result.userConcerns && result.userConcerns.length > 0) {
      checkPageBreak(60);
      
      doc.setFillColor(254, 243, 199);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
      doc.text('USER CONCERNS & PRIORITIES', margin + 5, yPosition + 7);
      yPosition += 15;
      
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'normal');
      result.userConcerns.forEach(concern => {
        checkPageBreak(15);
        const concernLines = doc.splitTextToSize('- ' + sanitizeText(concern), pageWidth - 2 * margin - 20);
        doc.text(concernLines, margin + 10, yPosition);
        yPosition += (concernLines.length * 5) + 3;
      });
      
      yPosition += 10;
    }
    
    // Environmental Factors
    if (result.environmentalFactors && result.environmentalFactors.length > 0) {
      checkPageBreak(60);
      
      doc.setFillColor(254, 243, 199);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
      doc.text('ENVIRONMENTAL & SITUATIONAL FACTORS', margin + 5, yPosition + 7);
      yPosition += 15;
      
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'normal');
      result.environmentalFactors.forEach(factor => {
        checkPageBreak(15);
        const factorLines = doc.splitTextToSize('- ' + sanitizeText(factor), pageWidth - 2 * margin - 20);
        doc.text(factorLines, margin + 10, yPosition);
        yPosition += (factorLines.length * 5) + 3;
      });
      
      yPosition += 10;
    }
  }
  
  // ========== FINAL PAGE: NEXT STEPS ==========
  if (result.recommendedActions && result.recommendedActions.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    // Header
    doc.setFillColor(245, 158, 11);
    doc.rect(0, yPosition, pageWidth, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('IMMEDIATE ACTION REQUIRED', pageWidth / 2, yPosition + 25, { align: 'center' });
    
    yPosition += 50;
    
    result.recommendedActions.forEach((action, i) => {
      checkPageBreak(35);
      
      // Action box
      doc.setFillColor(255, 250, 230);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 5, 5, 'F');
      
      // Number circle
      doc.setFillColor(245, 158, 11);
      doc.circle(margin + 15, yPosition + 15, 10, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text((i + 1).toString(), margin + 15, yPosition + 19, { align: 'center' });
      
      // Action text
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'normal');
      const actionLines = doc.splitTextToSize(sanitizeText(action), pageWidth - 2 * margin - 40);
      doc.text(actionLines, margin + 30, yPosition + 12);
      
      yPosition += 35;
    });
  }
  
  // Footer on last page
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by QuoteScout AI | Professional Home Service Analysis', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc.output('blob');
}
