import { ref } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { read, utils } from 'xlsx';

// Configure PDF.js worker for Vite - using a more compatible approach
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const useDocumentAnalyzer = () => {
    const isAnalyzing = ref(false);
    const documentContent = ref<string>('');
    const documentName = ref<string>('');
    const analysisError = ref<string | null>(null);

    const resetDocument = () => {
        documentContent.value = '';
        documentName.value = '';
        analysisError.value = null;
    };

    const analyzeFile = async (file: File) => {
        isAnalyzing.value = true;
        analysisError.value = null;
        documentName.value = file.name;

        try {
            const text = await extractText(file);
            documentContent.value = text;
            console.log("Document text extracted:", text.substring(0, 100) + "...");
        } catch (e: any) {
            console.error("Error analyzing file:", e);
            analysisError.value = `No pude leer el archivo: ${e.message}`;
            documentName.value = '';
        } finally {
            isAnalyzing.value = false;
        }
    };

    const extractText = async (file: File): Promise<string> => {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        // PDF
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            return await extractPdfText(file);
        }

        // Word Documents (DOCX and DOC)
        if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileType === 'application/msword' ||
            fileName.endsWith('.docx') ||
            fileName.endsWith('.doc')) {
            return await extractDocxText(file);
        }

        // XML
        if (fileType === 'application/xml' || fileType === 'text/xml' || fileName.endsWith('.xml')) {
            return await extractXmlText(file);
        }

        // Excel
        if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            fileType === 'application/vnd.ms-excel' ||
            fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            return await extractExcelText(file);
        }

        // JSON
        if (fileType === 'application/json' || fileName.endsWith('.json')) {
            const text = await extractPlainText(file);
            try {
                const parsed = JSON.parse(text);
                return JSON.stringify(parsed, null, 2);
            } catch {
                return text;
            }
        }

        // Plain text, CSV, and other text-based formats
        if (fileType.startsWith('text/') ||
            fileName.endsWith('.txt') ||
            fileName.endsWith('.csv') ||
            fileName.endsWith('.log') ||
            fileName.endsWith('.md')) {
            return await extractPlainText(file);
        }

        throw new Error(`Tipo de archivo no soportado: ${fileType || fileName}`);
    };

    const extractPlainText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    const extractPdfText = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += `--- Página ${i} ---\n${pageText}\n\n`;
        }

        return fullText;
    };

    const extractDocxText = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        if (!result.value) {
            throw new Error("No se pudo extraer texto del documento Word");
        }

        return result.value;
    };

    const extractXmlText = async (file: File): Promise<string> => {
        const text = await extractPlainText(file);

        // Try to format XML nicely
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');

            // Extract text content from all nodes
            const extractTextFromNode = (node: Node): string => {
                let text = '';

                if (node.nodeType === Node.TEXT_NODE) {
                    const content = node.textContent?.trim();
                    if (content) text += content + ' ';
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    text += `\n[${element.tagName}]: `;

                    for (let i = 0; i < node.childNodes.length; i++) {
                        text += extractTextFromNode(node.childNodes[i]);
                    }
                }

                return text;
            };

            return extractTextFromNode(xmlDoc.documentElement);
        } catch {
            // If parsing fails, return raw text
            return text;
        }
    };

    const extractExcelText = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = read(arrayBuffer, { type: 'array' });

        let fullText = '';

        workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const data = utils.sheet_to_json(sheet, { header: 1 }) as any[][];

            fullText += `\n--- Hoja: ${sheetName} ---\n`;

            data.forEach((row, index) => {
                if (row.length > 0) {
                    fullText += `Fila ${index + 1}: ${row.join(' | ')}\n`;
                }
            });

            fullText += '\n';
        });

        return fullText;
    };

    return {
        isAnalyzing,
        documentContent,
        documentName,
        analysisError,
        analyzeFile,
        resetDocument
    };
};
