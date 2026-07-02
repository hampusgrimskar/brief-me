"use client";

import { Decision } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface DecisionFieldProps {
  decision: Decision;
  value: string | string[] | boolean | undefined;
  onChange: (value: string | string[] | boolean) => void;
  disabled?: boolean;
}

export function DecisionField({
  decision,
  value,
  onChange,
  disabled,
}: DecisionFieldProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <h4 className="font-medium">{decision.label}</h4>
        {decision.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {decision.description}
          </p>
        )}
      </div>

      {decision.type === "single-select" && decision.options && (
        <RadioGroup
          value={(value as string) || ""}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
        >
          {decision.options.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${decision.id}-${option}`} />
              <Label htmlFor={`${decision.id}-${option}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {decision.type === "multi-select" && decision.options && (
        <div className="space-y-2">
          {decision.options.map((option) => {
            const selected = Array.isArray(value) ? value : [];
            return (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${decision.id}-${option}`}
                  checked={selected.includes(option)}
                  disabled={disabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selected, option]);
                    } else {
                      onChange(selected.filter((v) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${decision.id}-${option}`}>{option}</Label>
              </div>
            );
          })}
        </div>
      )}

      {decision.type === "confirm" && (
        <div className="flex gap-2">
          <Button
            variant={(value as boolean) === true ? "default" : "outline"}
            size="sm"
            disabled={disabled}
            onClick={() => onChange(true)}
          >
            Approve
          </Button>
          <Button
            variant={(value as boolean) === false ? "destructive" : "outline"}
            size="sm"
            disabled={disabled}
            onClick={() => onChange(false)}
          >
            Reject
          </Button>
        </div>
      )}

      {decision.type === "text" && (
        <Textarea
          placeholder="Type your response..."
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
