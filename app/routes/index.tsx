import { useRef, useState } from "react";
import { saveAs } from 'file-saver';
import { toBlob } from 'html-to-image';
import Result from "~/types";
import styles from "~/styles/index.css";
import notFoundImage from "~/images/not-found.jpg";

export function links() {
  return [
    { rel: "stylesheet", href: styles }
  ]
}

export default function Index() {
  const [link, setLink] = useState("https://github.com");
  const [output, setOutput] = useState<Result | undefined>(undefined);
  const [resultState, setResultState] = useState<"idle" | "loading" | "data" | "error">("idle");

  const outputContainerRef = useRef<HTMLDivElement | null>(null);

  const onFetch = async () => {
    if (!link) {
      setResultState("error");
      return;
    }
    try {
      setResultState("loading");
      const res = await fetch("/hell", { method: "POST", body: JSON.stringify({ url: link }) });
      const json: { data: Result | undefined } = await res.json();
      if (json.data) {
        setOutput(json.data);
        setResultState("data");
      } else {
        setResultState("error");
      }
    } catch (error) {
      console.error(error);
      setResultState("error");
    }
  }

  const onCapture = async () => {
    const outputContainer = outputContainerRef.current;
    if (!outputContainer) return;
    const {width, height} = outputContainer.getBoundingClientRect();
    const options = {
      skipAutoScale: false,
      width: width + 20,
      height: height + 20,
    };
    const blob = await toBlob(outputContainer, options);
    if (!blob) return;
    saveAs(blob, `${output?.title ?? "website"}.png`)
  }

  const renderOutput = () => {
    switch (resultState) {
      case "loading":
        return <div className="lds-hourglass"></div>;

      case "data":
        return output ?
          (
            <div className="capture-container">
              <div ref={outputContainerRef} className="output-container">
                <img className="output-img" src={output.image.url ?? notFoundImage} height={200} width={300} title={output.image.alt} />
                <div className="output-title">{output.title}</div>
                <div className="output-description">{output.description}</div>
              </div>
              <button onClick={onCapture} className="capture">Capture</button>
            </div>
          ) : (<div>null</div>);

      case "error":
        return <div className="error-container">Something gone wrong</div>;

      default:
        return null;
    }
  }

  return (
    <main className="primary-container">
      <div className="primary-row">
        <input className="primary-input" value={link} onKeyDown={e => {
          if (e.code === "Enter") {
            e.preventDefault();
            onFetch();
          }

        }} onChange={e => setLink(e.target.value)} />
        <button disabled={resultState === "loading"} className="primary-button" onClick={onFetch}>Fetch</button>
      </div>
      {renderOutput()}
    </main>
  );
}
