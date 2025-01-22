import type { MetaFunction } from "@remix-run/node";
import { useCallback, useState } from "react";

const NEWLINE = "\n".charCodeAt(0);

// concatenates all the chunks into a single Uint8Array
function concatChunks(chunks: Uint8Array[], totalLength: number) {
  const concatenatedChunks = new Uint8Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    concatenatedChunks.set(chunk, offset);
    offset += chunk.length;
  }
  chunks.length = 0;

  return concatenatedChunks;
}

const token = "";
const apiUrl = "";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

type MaskaraMessageType = {
  role: "user" | "agent";
  content: string;
};

function Message({ content, role }: MaskaraMessageType) {
  return (
    <div className="m-4 p-2 border rounded-xl">
      {role}: {content}
    </div>
  );
}

export default function Index() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MaskaraMessageType[]>([]);
  const [prompt, setPrompt] = useState("");

  const handleInputChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(evt.target.value);
    },
    []
  );

  const callApi = async (payload: string) => {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: payload,
      }),
    });

    if (res.ok) {
      const stream = res.body as ReadableStream<Uint8Array>;
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      const chunks: Uint8Array[] = [];
      let totalLength = 0;

      while (true) {
        const { value } = await reader.read();

        if (value) {
          chunks.push(value);
          totalLength += value.length;
          if (value[value.length - 1] !== NEWLINE) {
            continue;
          }
        }

        if (chunks.length === 0) {
          break;
        }

        const concatenatedChunks = concatChunks(chunks, totalLength);
        totalLength = 0;

        const streamParts = decoder
          .decode(concatenatedChunks, { stream: true })
          .split(/\n(?=event: )/)
          // TODO
          .map((res) => console.log(res));
      }
    }
  };

  const handleSubmit = useCallback(() => {
    setMessages((prevM) => [
      ...prevM,
      {
        role: "user",
        content: input,
      },
      // TODO
      {
        role: "agent",
        content: input,
      },
    ]);
    callApi(input);
    setInput("");
  }, [input, setInput]);

  return (
    <div className="flex h-screen p-16">
      <div className="basis-1/2 flex flex-col">
        <div>
          {messages.map((m, i) => (
            <Message content={m.content} role={m.role} key={`message-${i}`} />
          ))}
        </div>
        <div className="mt-auto">
          <textarea value={input} onChange={handleInputChange}></textarea>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
      <div className="basis-1/2">
        Prompt: <br />
        {prompt}
      </div>
    </div>
  );
}
