import { ChevronDown, User } from "lucide-react";
import { useState } from "react";

interface ClienteProps {
  nome: string;
  endereco: string;
  cep: string;
  cidade: string;
  estado: string;
  documento: {
    tipo: "CPF" | "CNPJ";
    valor: string;
  };
}

export function ClienteCard({ cliente }: { cliente: ClienteProps }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Dados do Cliente</h3>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-6 py-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nome</p>
            <p className="font-medium text-gray-900">{cliente.nome}</p>
          </div>

          <div>
            <p className="text-gray-500">{cliente.documento.tipo}</p>
            <p className="font-medium text-gray-900">
              {cliente.documento.valor || "Não informado"}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-gray-500">Endereço</p>
            <p className="font-medium text-gray-900">{cliente.endereco}</p>
          </div>

          <div>
            <p className="text-gray-500">CEP</p>
            <p className="font-medium text-gray-900">{cliente.cep}</p>
          </div>

          <div>
            <p className="text-gray-500">Cidade / UF</p>
            <p className="font-medium text-gray-900">
              {cliente.cidade} - {cliente.estado}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
