import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  ListParagraph, 
  LevelFormat 
} from 'docx';
import { saveAs } from 'file-saver';
import { 
  GetSetForPlayResponse, 
  GetSetDetailsResponse,
  StudyItemType, 
  QuizQuestionContent, 
  CheckboxQuestionContent, 
  MatchingPairsContent, 
  OrderSequenceContent, 
  WrittenAnswerContent, 
  FlashcardContent,
  NoteContent 
} from '../types/study';

export interface ExportFormatOptions {
  includeQuestion: boolean;
  includeOptions: boolean;
  includeBlank: boolean; // for written answers
  includeAnswerKey: boolean;
  includeExplanation: boolean;
}

export interface WordExportOptions {
  setTitle: string;
  selectedItemIds: string[];
  formats: Record<string, ExportFormatOptions>; // item.id -> ExportFormatOptions
}

export const generateWordFile = async (data: GetSetForPlayResponse | GetSetDetailsResponse, options: WordExportOptions) => {
  const { set, items } = data;
  const filteredItems = items.filter(item => options.selectedItemIds.includes(item.id));

  const subjectName = (set as any).subject_name || (set as any).subject || 'N/A';

  const children: any[] = [
    new Paragraph({
      text: set.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Subject: ${subjectName}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  filteredItems.forEach((item, index) => {
    const format = options.formats[item.id] || {
      includeQuestion: true,
      includeOptions: true,
      includeBlank: true,
      includeAnswerKey: true,
      includeExplanation: true,
    };

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Item ${index + 1}: `,
            bold: true,
          }),
        ],
        spacing: { before: 400, after: 200 },
      })
    );

    switch (item.type) {
      case 'quiz_question': {
        const content = item.content as QuizQuestionContent;
        if (format.includeQuestion) {
          children.push(new Paragraph({ text: content.question }));
        }
        if (format.includeOptions) {
          content.options.forEach((opt, optIdx) => {
            children.push(
              new Paragraph({
                text: `${String.fromCharCode(65 + optIdx)}. ${opt.text}`,
                indent: { left: 720 },
              })
            );
          });
        }
        if (format.includeAnswerKey) {
          const correctOpt = content.options.find(o => o.id === content.correct_option_id);
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Answer Key: ', bold: true }),
                new TextRun({ text: correctOpt ? correctOpt.text : 'N/A' }),
              ],
              spacing: { before: 100 },
            })
          );
        }
        if (format.includeExplanation && content.explanation) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Explanation: ', italic: true, bold: true }),
                new TextRun({ text: content.explanation, italic: true }),
              ],
            })
          );
        }
        break;
      }

      case 'checkbox_question': {
        const content = item.content as CheckboxQuestionContent;
        if (format.includeQuestion) {
          children.push(new Paragraph({ text: content.question }));
        }
        if (format.includeOptions) {
          content.options.forEach((opt, optIdx) => {
            children.push(
              new Paragraph({
                text: `[ ] ${opt.text}`,
                indent: { left: 720 },
              })
            );
          });
        }
        if (format.includeAnswerKey) {
          const correctOpts = content.options
            .filter(o => content.correct_option_ids.includes(o.id))
            .map(o => o.text)
            .join(', ');
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Answer Key: ', bold: true }),
                new TextRun({ text: correctOpts || 'N/A' }),
              ],
              spacing: { before: 100 },
            })
          );
        }
        if (format.includeExplanation && content.explanation) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Explanation: ', italic: true, bold: true }),
                new TextRun({ text: content.explanation, italic: true }),
              ],
            })
          );
        }
        break;
      }

      case 'matching_pairs': {
        const content = item.content as MatchingPairsContent;
        if (format.includeQuestion && content.question) {
          children.push(new Paragraph({ text: content.question }));
        }
        if (format.includeOptions) {
          children.push(new Paragraph({ text: 'Match the following:', spacing: { before: 100 } }));
          content.pairs.forEach((pair, pIdx) => {
            children.push(
              new Paragraph({
                text: `${pIdx + 1}. ${pair.left}  ---  ( ) ${pair.right}`,
                indent: { left: 720 },
              })
            );
          });
        }
        if (format.includeAnswerKey) {
          children.push(new Paragraph({ text: 'Answer Key:', bold: true, spacing: { before: 100 } }));
          content.pairs.forEach((pair, pIdx) => {
            children.push(
              new Paragraph({
                text: `${pIdx + 1}. ${pair.left} -> ${pair.right}`,
                indent: { left: 720 },
              })
            );
          });
        }
        if (format.includeExplanation && content.explanation) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Explanation: ', italic: true, bold: true }),
                new TextRun({ text: content.explanation, italic: true }),
              ],
            })
          );
        }
        break;
      }

      case 'order_sequence': {
        const content = item.content as OrderSequenceContent;
        if (format.includeQuestion && content.question) {
          children.push(new Paragraph({ text: content.question }));
        }
        if (format.includeOptions) {
          children.push(new Paragraph({ text: 'Put in order:', spacing: { before: 100 } }));
          // Scramble them for the user? Actually we just show them as is if it's "format to be included"
          // Usually ordered sequence in a doc would show them shuffled then the key.
          content.items.forEach((ordItem) => {
            children.push(
              new Paragraph({
                text: `( ) ${ordItem.text}`,
                indent: { left: 720 },
              })
            );
          });
        }
        if (format.includeAnswerKey) {
          children.push(new Paragraph({ text: 'Correct Order:', bold: true, spacing: { before: 100 } }));
          content.items.forEach((ordItem, ordIdx) => {
            children.push(
              new Paragraph({
                text: `${ordIdx + 1}. ${ordItem.text}`,
                indent: { left: 720 },
              })
            );
          });
        }
        if (format.includeExplanation && content.explanation) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Explanation: ', italic: true, bold: true }),
                new TextRun({ text: content.explanation, italic: true }),
              ],
            })
          );
        }
        break;
      }

      case 'written_answer': {
        const content = item.content as WrittenAnswerContent;
        if (format.includeQuestion) {
          children.push(new Paragraph({ text: content.question }));
        }
        if (format.includeBlank) {
          children.push(
            new Paragraph({
              text: '__________________________________________________________________',
              spacing: { before: 200, after: 200 },
            })
          );
        }
        if (format.includeAnswerKey) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Accepted Answers: ', bold: true }),
                new TextRun({ text: content.accepted_answers.join(', ') }),
              ],
            })
          );
        }
        if (format.includeExplanation && content.explanation) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Explanation: ', italic: true, bold: true }),
                new TextRun({ text: content.explanation, italic: true }),
              ],
            })
          );
        }
        break;
      }

      case 'flashcard': {
        const content = item.content as FlashcardContent;
        // "For flashcard show all"
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Front: ', bold: true }),
              new TextRun({ text: content.front }),
            ],
          })
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Back: ', bold: true }),
              new TextRun({ text: content.back }),
            ],
          })
        );
        if (content.explanation) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Explanation: ', italic: true, bold: true }),
                new TextRun({ text: content.explanation, italic: true }),
              ],
            })
          );
        }
        break;
      }

      case 'note': {
        const content = item.content as NoteContent;
        // Notes always show all (title and markdown)
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Title: ', bold: true }),
              new TextRun({ text: content.title }),
            ],
          })
        );
        children.push(
          new Paragraph({
            text: content.markdown,
            spacing: { before: 100 },
          })
        );
        break;
      }
      
      default:
        break;
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${set.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.docx`);
};
