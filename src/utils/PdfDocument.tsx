import * as React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";

export interface PdfDocumentProps {
  title: string;
  document: JSX.Element;
}

const PdfDocument: React.FC<PdfDocumentProps> = ({ title, document }) => {
  const { useState, useEffect } = React;
  const [ready, setReady] = useState(false);

  // this is hacky but helps set the render to the back of event queue https://github.com/diegomura/react-pdf/issues/420
  useEffect(() => {
    setTimeout(() => {
      setReady(true);
    }, 0);
  }, []);
  // end of hacky stuff

  if (!ready) {
    return null;
  } else {
    return (
      <PDFDownloadLink document={document} fileName="filename1.pdf">
        {({ url, loading, error }) =>
          loading ? "Loading document..." : "Download now!"
        }
      </PDFDownloadLink>
    );
  }
};

export default PdfDocument;
