"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Copy, Check, Loader2, Linkedin } from "lucide-react";

export default function Home() {
  const [sourceText, setSourceText] = useState("");
  const [tone, setTone] = useState("professional");
  const [generatedPost, setGeneratedPost] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedPost("");
    setProgress(10);
    
    try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceText, tone }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        setProgress(40);

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          setGeneratedPost((prev) => prev + decoder.decode(value));
          setProgress((prev) => Math.min(prev + 1, 95));
        }
        setProgress(100);
    } catch (e) {
        console.error("Error", e);
    } finally {
        setIsLoading(false);
        setTimeout(() => setProgress(0), 500);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12">
      <main className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <div className="bg-[#0077b5] p-1.5 rounded">
            <Linkedin className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">LinkedPost AI</h1>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
          {progress > 0 && (
            <Progress value={progress} className="absolute top-0 left-0 right-0 h-1 bg-transparent text-blue-600" />
          )}
          <CardContent className="p-6 space-y-4">
            <Textarea 
              placeholder="Вставте ідею або текст..."
              className="bg-black border-zinc-700 text-white min-h-[150px] focus:ring-blue-500"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
            
            <div className="flex gap-2">
              {['professional', 'creative', 'bold'].map((t) => (
                <Button 
                  key={t}
                  variant={tone === t ? "default" : "outline"}
                  onClick={() => setTone(t)}
                  className={`capitalize ${tone === t ? "bg-blue-600" : "border-zinc-700 text-zinc-400"}`}
                >
                  {t}
                </Button>
              ))}
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12" 
              onClick={handleGenerate}
              disabled={isLoading || !sourceText}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Згенерувати пост
            </Button>
          </CardContent>
        </Card>

        {generatedPost && (
          <Card className="bg-zinc-900 border-zinc-800 animate-in fade-in duration-700">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <span className="text-xs font-medium text-zinc-500 uppercase">Результат</span>
              <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                {isCopied ? <Check className="text-green-500 w-4 h-4" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              </Button>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-zinc-200 leading-relaxed border-t border-zinc-800 pt-4">
              {generatedPost}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}