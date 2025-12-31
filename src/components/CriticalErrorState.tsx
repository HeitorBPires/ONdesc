import { AlertCircle } from "lucide-react";

export function CriticalErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-semibold text-gray-900">
        Não foi possível processar a fatura
      </h2>
      <p className="text-gray-500 max-w-md">
        {message ??
          "Ocorreu um erro ao ler o PDF. Verifique se o arquivo enviado é uma fatura válida da Copel."}
      </p>
    </div>
  );
}
