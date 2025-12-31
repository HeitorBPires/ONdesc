import { AlertTriangle } from "lucide-react";

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationAlertProps {
  errors: ValidationError[];
}

export function ValidationAlert({ errors }: ValidationAlertProps) {
  if (!errors.length) return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <h4 className="font-semibold text-yellow-800">
          Alguns dados não puderam ser validados
        </h4>
      </div>

      <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
        {errors.map((err, index) => (
          <li key={index}>
            <span className="font-medium">{err.field}:</span> {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
