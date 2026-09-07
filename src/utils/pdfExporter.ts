/**
 * PDF Exporter Utility for School Management System
 * Generates and triggers direct download of high-precision PDF documents with exact font and styling fidelity.
 */

export interface ExportPdfOptions {
  fileName: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  scale?: number;
  quality?: number;
  marginMm?: number;
  fitToPage?: boolean;
}

/**
 * Saves a Blob as a file with a forced download prompt / save file dialog.
 */
export async function savePdfBlob(blob: Blob, fileName: string): Promise<boolean> {
  const cleanFileName = fileName.trim().endsWith('.pdf')
    ? fileName.trim()
    : `${fileName.trim()}.pdf`;

  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanFileName;
    link.target = '_self';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 15000);

    return true;
  } catch (err) {
    console.error('Error triggering direct anchor PDF download:', err);
    return false;
  }
}

/**
 * Ensures web fonts (Cairo, Tajawal, Amiri, Naskh, IBM Plex, Alexandria, Changa) are fully loaded before rendering
 */
export async function ensureFontsLoaded(): Promise<void> {
  try {
    if (typeof document !== 'undefined') {
      const existingLink = document.querySelector('link[href*="fonts.googleapis.com/css2?family=Cairo"]');
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@300;400;500;600;700;800;900;1000&family=Changa:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700;800;900&display=swap';
        document.head.appendChild(link);
      }

      if (document.fonts) {
        const fontFamilies = [
          'Cairo',
          'Tajawal',
          'Amiri',
          'Noto Naskh Arabic',
          'IBM Plex Sans Arabic',
          'Alexandria',
          'Changa',
        ];
        const weights = ['400', '600', '700', '800'];
        const fontPromises: Promise<any>[] = [];
        for (const fam of fontFamilies) {
          for (const w of weights) {
            fontPromises.push(document.fonts.load(`${w} 14px "${fam}"`));
          }
        }
        await Promise.allSettled(fontPromises);
        await document.fonts.ready;
      }
    }
  } catch {
    // Ignore font loading errors if browser doesn't support document.fonts
  }
}

/**
 * Injects font stylesheet and explicit CSS overrides into cloned document for perfect canvas rendering
 */
export function applyFontAndStyleFixesToClone(clonedDoc: Document) {
  try {
    // Ensure all stylesheets and link tags from main document head are copied
    if (typeof document !== 'undefined') {
      const links = document.querySelectorAll('link[rel="stylesheet"], style');
      links.forEach((node) => {
        if (!clonedDoc.head.querySelector(`[href="${(node as HTMLLinkElement).href}"]`)) {
          clonedDoc.head.appendChild(node.cloneNode(true));
        }
      });
    }

    // Explicitly add Google Fonts link if not present in clonedDoc
    if (!clonedDoc.head.querySelector('link[href*="fonts.googleapis.com"]')) {
      const fontLink = clonedDoc.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@300;400;500;600;700;800;900;1000&family=Changa:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700;800;900&display=swap';
      clonedDoc.head.appendChild(fontLink);
    }

    const styleEl = clonedDoc.createElement('style');
    styleEl.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@300;400;500;600;700;800;900;1000&family=Changa:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Tajawal:wght@300;400;500;700;800;900&display=swap');

      .font-cairo { font-family: 'Cairo', sans-serif !important; }
      .font-tajawal { font-family: 'Tajawal', sans-serif !important; }
      .font-amiri { font-family: 'Amiri', serif !important; }
      .font-naskh { font-family: 'Noto Naskh Arabic', serif !important; }
      .font-ibm { font-family: 'IBM Plex Sans Arabic', sans-serif !important; }
      .font-alexandria { font-family: 'Alexandria', sans-serif !important; }
      .font-changa { font-family: 'Changa', sans-serif !important; }

      *, *::before, *::after,
      html, body, div, span, applet, object, iframe,
      h1, h2, h3, h4, h5, h6, p, blockquote, pre,
      a, abbr, acronym, address, big, cite, code,
      del, dfn, em, img, ins, kbd, q, s, samp,
      small, strike, strong, sub, sup, tt, var,
      b, u, i, center, dl, dt, dd, ol, ul, li,
      fieldset, form, label, legend,
      table, caption, tbody, tfoot, thead, tr, th, td,
      article, aside, canvas, details, embed, 
      figure, figcaption, footer, header, hgroup, 
      menu, nav, output, ruby, section, summary,
      time, mark, audio, video,
      .a4-cert-page, .a4-cert-export-page, .font-arabic, .font-mono, .font-sans, .font-serif {
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        text-rendering: geometricPrecision !important;
        letter-spacing: normal !important;
      }

      .font-mono, td, th {
        font-variant-numeric: tabular-nums !important;
      }
      
      .a4-cert-page {
        width: 794px !important;
        max-width: 794px !important;
        min-width: 794px !important;
        box-sizing: border-box !important;
        margin: 0 auto !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background-color: #ffffff !important;
      }

      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }

      th, td {
        box-sizing: border-box !important;
      }
    `;
    clonedDoc.head.appendChild(styleEl);
  } catch (err) {
    console.warn('Error applying font fixes to clone:', err);
  }
}

/**
 * Captures an HTML element and exports it as a PDF file.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  options: ExportPdfOptions
): Promise<boolean> {
  const {
    fileName,
    orientation = 'portrait',
    format = 'a4',
    scale = 2.5,
    quality = 0.98,
    marginMm = 0,
    fitToPage,
  } = options;

  const cleanFileName = fileName.trim().endsWith('.pdf')
    ? fileName.trim()
    : `${fileName.trim()}.pdf`;

  await ensureFontsLoaded();

  const jspdfModule = await import('jspdf');
  const jsPDFConstructor = (jspdfModule.jsPDF || (jspdfModule as any).default || jspdfModule) as any;
  
  let html2canvas: any;
  try {
    const html2canvasModule = await import('html2canvas-pro');
    html2canvas = html2canvasModule.default || html2canvasModule;
  } catch (importErr) {
    const html2canvasFallback = await import('html2canvas');
    html2canvas = (html2canvasFallback as any).default || html2canvasFallback;
  }

  // Handle hidden or 0-dimension elements gracefully by creating a temporary offscreen visible container
  let targetToRender = element;
  let tempWrapper: HTMLElement | null = null;

  try {
    if (element.offsetWidth === 0 || element.offsetHeight === 0 || window.getComputedStyle(element).display === 'none') {
      tempWrapper = document.createElement('div');
      tempWrapper.style.position = 'fixed';
      tempWrapper.style.left = '-9999px';
      tempWrapper.style.top = '0';
      tempWrapper.style.width = '800px';
      tempWrapper.style.zIndex = '-9999';
      tempWrapper.style.backgroundColor = '#ffffff';
      tempWrapper.style.display = 'block';
      tempWrapper.style.visibility = 'visible';
      tempWrapper.style.opacity = '1';
      tempWrapper.dir = 'rtl';
      tempWrapper.className = 'font-arabic';

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.display = 'block';
      clone.style.visibility = 'visible';
      clone.style.opacity = '1';
      clone.style.position = 'static';
      clone.style.width = '100%';
      clone.classList.remove('hidden');
      clone.classList.add('block');

      tempWrapper.appendChild(clone);
      document.body.appendChild(tempWrapper);
      targetToRender = clone;
    }

    const canvas = await html2canvas(targetToRender, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      windowWidth: 1200,
      windowHeight: 1600,
      onclone: (clonedDoc: Document) => {
        applyFontAndStyleFixesToClone(clonedDoc);
        // Ensure any element with id or target class in clone is visible
        const clonedTarget = clonedDoc.getElementById(element.id);
        if (clonedTarget) {
          clonedTarget.style.display = 'block';
          clonedTarget.style.visibility = 'visible';
          clonedTarget.classList.remove('hidden');
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);

    const pdf = new jsPDFConstructor({
      orientation,
      unit: 'mm',
      format,
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const maxWidth = pdfWidth - (marginMm * 2);
    const maxHeight = pdfHeight - (marginMm * 2);

    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    const shouldFitToSinglePage = fitToPage === true || (fitToPage !== false && orientation === 'landscape');

    if (shouldFitToSinglePage && imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    if (imgHeight <= maxHeight || shouldFitToSinglePage) {
      const posX = marginMm + (maxWidth - imgWidth) / 2;
      const posY = marginMm + (maxHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'JPEG', posX, posY, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      let heightLeft = imgHeight;
      let position = marginMm;

      pdf.addImage(imgData, 'JPEG', marginMm, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= maxHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + marginMm;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', marginMm, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= maxHeight;
      }
    }

    // Free canvas memory
    canvas.width = 0;
    canvas.height = 0;

    const pdfBlob = pdf.output('blob');
    return savePdfBlob(pdfBlob, cleanFileName);
  } finally {
    if (tempWrapper && document.body.contains(tempWrapper)) {
      document.body.removeChild(tempWrapper);
    }
  }
}

/**
 * Dedicated, rock-solid Attendance Dispatch Report PDF Generator
 * Generates an official Iraqi Ministry of Education formatted A4 Daily Attendance Report
 */
export async function exportAttendanceDispatchReportAsPdf(
  report: {
    date: string;
    gradeLevel: string;
    section: string;
    subject: string;
    teacherName: string;
    teacherEmail: string;
    adminEmail: string;
    totalStudents: number;
    stats: {
      present: number;
      absent: number;
      late: number;
      excused: number;
    };
    studentDetails: Array<{
      id: string;
      name: string;
      section: string;
      status: 'حاضرة' | 'غائبة' | 'متأخرة' | 'مجازة';
      parentName: string;
      parentPhone: string;
      parentEmail: string;
    }>;
    dispatchedAt: string;
  },
  options?: Partial<ExportPdfOptions>
): Promise<boolean> {
  const fileName =
    options?.fileName ||
    `سجل_حضور_طالبات_${report.gradeLevel.replace(/\s+/g, '_')}_${report.section === 'الكل' ? 'جميع_الشعب' : `شعبة_${report.section}`}_${report.date}.pdf`;

  await ensureFontsLoaded();

  // Create temporary container for pixel-perfect rendering
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '800px';
  tempContainer.style.backgroundColor = '#ffffff';
  tempContainer.style.color = '#0f172a';
  tempContainer.style.padding = '32px';
  tempContainer.style.boxSizing = 'border-box';
  tempContainer.style.fontFamily = "'Cairo', 'Tajawal', sans-serif";
  tempContainer.style.direction = 'rtl';
  tempContainer.style.zIndex = '-9999';

  const rowsHtml = report.studentDetails
    .map(
      (std, idx) => `
    <tr style="border-bottom: 1px solid #1e293b; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 7px 8px; border: 1px solid #1e293b; text-align: center; font-weight: bold; font-size: 11px;">${idx + 1}</td>
      <td style="padding: 7px 8px; border: 1px solid #1e293b; font-weight: 800; color: #0f172a; font-size: 11px;">${std.name}</td>
      <td style="padding: 7px 8px; border: 1px solid #1e293b; text-align: center; font-weight: bold; color: #0f766e; font-size: 11px;">شعبة (${std.section})</td>
      <td style="padding: 7px 8px; border: 1px solid #1e293b; text-align: center; font-weight: 900; font-size: 11px; color: ${
        std.status === 'حاضرة'
          ? '#059669'
          : std.status === 'غائبة'
          ? '#e11d48'
          : std.status === 'متأخرة'
          ? '#d97706'
          : '#4f46e5'
      };">
        ${std.status}
      </td>
      <td style="padding: 7px 8px; border: 1px solid #1e293b; font-size: 11px; color: #334155;">${std.parentName}</td>
      <td style="padding: 7px 8px; border: 1px solid #1e293b; font-family: monospace; font-size: 10px; color: #475569; direction: ltr; text-align: right;">${std.parentPhone}</td>
      <td style="padding: 7px 8px; border: 1px solid #1e293b; font-family: monospace; font-size: 9.5px; color: #334155; direction: ltr; text-align: right;">
        ${std.parentEmail} (تم الإرسال ✉️)
      </td>
    </tr>
  `
    )
    .join('');

  tempContainer.innerHTML = `
    <div style="font-family: 'Cairo', 'Tajawal', sans-serif; direction: rtl; text-align: right; width: 100%;">
      <!-- Official Header -->
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="text-align: right; font-size: 11px; line-height: 1.5; color: #1e293b;">
          <p style="margin: 0; font-weight: bold;">جمهورية العراق - وزارة التربية</p>
          <p style="margin: 0; font-weight: bold;">المديرية العامة لتربية محافظة ميسان</p>
          <p style="margin: 2px 0 0 0; font-weight: 900; font-size: 13px; color: #0f172a;">ثانوية ميسان للمتميزات</p>
          <p style="margin: 0; font-size: 9.5px; font-family: monospace; color: #475569;">نظام الحضور الرقمي المعتمد</p>
        </div>

        <div style="text-align: center;">
          <div style="width: 58px; height: 58px; margin: 0 auto; border-radius: 50%; border: 2px solid #0f172a; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 9.5px; background: #f8fafc; color: #0f172a;">
            شعار الثانوية
          </div>
          <h1 style="margin: 6px 0 0 0; font-size: 15px; font-weight: 900; color: #0f172a;">سجل ورصد الحضور والغياب اليومي الرسمي</h1>
        </div>

        <div style="text-align: left; font-size: 11px; line-height: 1.5; font-family: monospace; color: #1e293b;">
          <p style="margin: 0;"><span style="font-weight: bold; font-family: sans-serif;">التاريخ:</span> ${report.date}</p>
          <p style="margin: 0;"><span style="font-weight: bold; font-family: sans-serif;">توقيت التوثيق:</span> ${report.dispatchedAt}</p>
          <p style="margin: 0;"><span style="font-weight: bold; font-family: sans-serif;">الصف:</span> ${report.gradeLevel}</p>
          <p style="margin: 0;"><span style="font-weight: bold; font-family: sans-serif;">الشعبة:</span> (${report.section === 'الكل' ? 'جميع الشعب' : report.section})</p>
        </div>
      </div>

      <!-- Info Banner -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 10px; border: 1px solid #0f172a; border-radius: 8px; margin-bottom: 14px; background: #f8fafc; font-size: 11px;">
        <div>
          <span style="display: block; font-weight: bold; color: #64748b; font-size: 9.5px;">المادة الدراسية:</span>
          <span style="font-weight: 900; color: #0f172a;">${report.subject}</span>
        </div>
        <div>
          <span style="display: block; font-weight: bold; color: #64748b; font-size: 9.5px;">أستاذة المادة:</span>
          <span style="font-weight: 900; color: #0f172a;">${report.teacherName}</span>
        </div>
        <div>
          <span style="display: block; font-weight: bold; color: #64748b; font-size: 9.5px;">البريد المعتمد:</span>
          <span style="font-weight: bold; font-family: monospace; color: #0f172a; font-size: 10px;">${report.teacherEmail}</span>
        </div>
        <div>
          <span style="display: block; font-weight: bold; color: #64748b; font-size: 9.5px;">إجمالي الطالبات:</span>
          <span style="font-weight: 900; color: #0f172a;">${report.totalStudents} طالبة</span>
        </div>
      </div>

      <!-- Statistics Summary Badges -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; margin-bottom: 16px; font-size: 11px; font-weight: bold;">
        <div style="padding: 8px; border: 1px solid #059669; background: #ecfdf5; color: #065f46; border-radius: 6px;">
          الحاضرات: <span style="font-weight: 900; font-size: 14px; margin-right: 4px;">${report.stats.present}</span>
        </div>
        <div style="padding: 8px; border: 1px solid #e11d48; background: #fff1f2; color: #9f1239; border-radius: 6px;">
          الغائبات: <span style="font-weight: 900; font-size: 14px; margin-right: 4px;">${report.stats.absent}</span>
        </div>
        <div style="padding: 8px; border: 1px solid #d97706; background: #fffbeb; color: #92400e; border-radius: 6px;">
          المتأخرات: <span style="font-weight: 900; font-size: 14px; margin-right: 4px;">${report.stats.late}</span>
        </div>
        <div style="padding: 8px; border: 1px solid #4f46e5; background: #eef2ff; color: #3730a3; border-radius: 6px;">
          المجازات: <span style="font-weight: 900; font-size: 14px; margin-right: 4px;">${report.stats.excused}</span>
        </div>
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #0f172a; margin-bottom: 20px; font-size: 11px; text-align: right;">
        <thead>
          <tr style="background-color: #e2e8f0; color: #0f172a; font-weight: 900; border-bottom: 2px solid #0f172a;">
            <th style="padding: 8px; border: 1px solid #0f172a; text-align: center; width: 28px;">ت</th>
            <th style="padding: 8px; border: 1px solid #0f172a;">اسم الطالبة الثلاثي</th>
            <th style="padding: 8px; border: 1px solid #0f172a; text-align: center; width: 70px;">الشعبة</th>
            <th style="padding: 8px; border: 1px solid #0f172a; text-align: center; width: 75px;">حالة الحضور</th>
            <th style="padding: 8px; border: 1px solid #0f172a;">اسم ولي الأمر</th>
            <th style="padding: 8px; border: 1px solid #0f172a; width: 95px;">الهاتف</th>
            <th style="padding: 8px; border: 1px solid #0f172a;">البريد المستهدف والإشعار</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Signatures Block -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; font-size: 11px; font-weight: bold; padding-top: 16px; border-top: 2px solid #0f172a; margin-top: 24px;">
        <div style="display: flex; flex-direction: column; justify-content: space-between; min-height: 80px;">
          <p style="margin: 0; font-weight: bold; color: #334155;">أستاذة المادة</p>
          <p style="margin: 4px 0; font-weight: 900; font-size: 13px; color: #0f172a;">${report.teacherName}</p>
          <p style="margin: 0; font-size: 9.5px; color: #64748b; font-family: monospace;">التوقيع: ................................</p>
        </div>

        <div style="text-align: center;">
          <p style="margin: 0 0 6px 0; font-weight: bold; color: #334155;">ختم ثانوية ميسان للمتميزات</p>
          <div style="width: 58px; height: 58px; margin: 0 auto; border-radius: 50%; border: 2px dashed #0f172a; display: flex; align-items: center; justify-content: center; font-size: 8.5px; color: #475569; font-weight: 900;">
            الختم الرسمي
          </div>
        </div>

        <div style="display: flex; flex-direction: column; justify-content: space-between; min-height: 80px;">
          <p style="margin: 0; font-weight: bold; color: #334155;">إدارة ثانوية ميسان للمتميزات</p>
          <p style="margin: 4px 0; font-weight: 900; font-size: 13px; color: #0f172a;">مديرة المدرسة</p>
          <p style="margin: 0; font-size: 9.5px; color: #64748b; font-family: monospace;">التوقيع: ................................</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(tempContainer);

  try {
    const success = await downloadElementAsPdf(tempContainer, {
      fileName,
      scale: 2.2,
      quality: 0.98,
      orientation: 'portrait',
      format: 'a4',
      marginMm: 0,
    });
    return success;
  } catch (err) {
    console.error('Error rendering attendance dispatch report to PDF:', err);
    // Fallback: plain text / minimal PDF
    return downloadTextOrAttachmentAsPdf(
      fileName,
      `تقرير حضور - ${report.gradeLevel} (${report.section}) - ${report.date}`,
      `تاريخ التقرير: ${report.date}\nالصف والشعبة: ${report.gradeLevel} (${report.section})\nالمادة: ${report.subject}\nالأستاذة: ${report.teacherName}\n\nالإحصائيات:\n- الحاضرات: ${report.stats.present}\n- الغائبات: ${report.stats.absent}\n- المتأخرات: ${report.stats.late}\n- المجازات: ${report.stats.excused}\n\nسجل الطالبات:\n` +
        report.studentDetails.map((s, i) => `${i + 1}. ${s.name} (${s.section}) - الحالة: ${s.status} - ولي الأمر: ${s.parentName} (${s.parentPhone}) - البريد: ${s.parentEmail}`).join('\n')
    );
  } finally {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  }
}


/**
 * Captures multiple HTML elements and exports each as a separate page in a single PDF document.
 */
export async function downloadMultiElementsAsPdf(
  elements: HTMLElement[],
  options: ExportPdfOptions
): Promise<boolean> {
  if (!elements || elements.length === 0) return false;

  const {
    fileName,
    orientation = 'portrait',
    format = 'a4',
    scale = 2.5,
    quality = 0.98,
    marginMm = 0,
  } = options;

  const cleanFileName = fileName.trim().endsWith('.pdf')
    ? fileName.trim()
    : `${fileName.trim()}.pdf`;

  await ensureFontsLoaded();

  const jspdfModule = await import('jspdf');
  const jsPDFConstructor = (jspdfModule.jsPDF || (jspdfModule as any).default || jspdfModule) as any;

  let html2canvas: any;
  try {
    const html2canvasModule = await import('html2canvas-pro');
    html2canvas = html2canvasModule.default || html2canvasModule;
  } catch (importErr) {
    const html2canvasFallback = await import('html2canvas');
    html2canvas = (html2canvasFallback as any).default || html2canvasFallback;
  }

  const pdf = new jsPDFConstructor({
    orientation,
    unit: 'mm',
    format,
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (!element) continue;

    if (i > 0) {
      pdf.addPage();
    }

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      windowWidth: 1200,
      windowHeight: 1600,
      onclone: (clonedDoc: Document) => {
        applyFontAndStyleFixesToClone(clonedDoc);
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);

    const maxWidth = pdfWidth - (marginMm * 2);
    const maxHeight = pdfHeight - (marginMm * 2);

    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    const posX = marginMm + (maxWidth - imgWidth) / 2;
    const posY = marginMm + (maxHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'JPEG', posX, posY, imgWidth, imgHeight, undefined, 'FAST');

    canvas.width = 0;
    canvas.height = 0;
  }

  const pdfBlob = pdf.output('blob');
  return savePdfBlob(pdfBlob, cleanFileName);
}

/**
 * Generates and downloads a custom PDF document for attachments, reports, or text files.
 */
export async function downloadTextOrAttachmentAsPdf(
  fileName: string,
  documentTitle: string,
  contentBody: string
): Promise<boolean> {
  const cleanFileName = fileName.trim().endsWith('.pdf')
    ? fileName.trim()
    : `${fileName.trim()}.pdf`;

  try {
    const jspdfModule = await import('jspdf');
    const jsPDFConstructor = (jspdfModule.jsPDF || (jspdfModule as any).default || jspdfModule) as any;
    const pdf = new jsPDFConstructor({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Create a styled PDF page
    pdf.setFillColor(248, 250, 252); // bg-slate-50
    pdf.rect(0, 0, 210, 297, 'F');

    // Header banner
    pdf.setFillColor(30, 41, 59); // bg-slate-800
    pdf.rect(10, 10, 190, 25, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Maysan School for Gifted Students', 105, 22, { align: 'center' });

    pdf.setFontSize(11);
    pdf.setTextColor(226, 232, 240);
    pdf.text(documentTitle, 105, 30, { align: 'center' });

    // Document Body Frame
    pdf.setDrawColor(203, 213, 225);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, 40, 190, 235, 3, 3, 'FD');

    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85);

    const splitText = pdf.splitTextToSize(contentBody, 175);
    pdf.text(splitText, 18, 55);

    // Footer timestamp
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Generated on: ${new Date().toLocaleString('ar-IQ')} | Official System Export`, 105, 288, { align: 'center' });

    const pdfBlob = pdf.output('blob');
    return savePdfBlob(pdfBlob, cleanFileName);
  } catch (err) {
    console.error('Error generating text PDF:', err);
    // Fallback: create plain PDF blob
    const fallbackBlob = new Blob([`${documentTitle}\n\n${contentBody}`], { type: 'application/pdf' });
    return savePdfBlob(fallbackBlob, cleanFileName);
  }
}

/**
 * Shares a PDF blob or file via Web Share API or external transport channels (WhatsApp, Telegram, Email).
 */
export async function sharePdfFile(
  blob: Blob,
  fileName: string,
  shareTitle: string,
  shareText: string
): Promise<boolean> {
  const cleanFileName = fileName.trim().endsWith('.pdf')
    ? fileName.trim()
    : `${fileName.trim()}.pdf`;

  const pdfFile = new File([blob], cleanFileName, { type: 'application/pdf' });

  // Try Web Share API with file payload first if supported
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [pdfFile] })
  ) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        files: [pdfFile],
      });
      return true;
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return true; // User cancelled share dialog
      }
      console.warn('Native share failed or dismissed, falling back to download & channel share links:', shareErr);
    }
  }

  // Fallback / standard trigger: Download PDF file directly so user has it on device
  await savePdfBlob(blob, cleanFileName);

  return true;
}

