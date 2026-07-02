"use client";

import React, { useMemo } from "react";
import { transform } from "sucrase";

// shadcn components available to agents
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Toggle } from "@/components/ui/toggle";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

// Map of components available in JSX strings
const componentScope: Record<string, unknown> = {
  // React
  React,
  Fragment: React.Fragment,

  // Layout
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Separator,
  ScrollArea,
  Collapsible, CollapsibleTrigger, CollapsibleContent,

  // Data display
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge,
  Avatar, AvatarImage, AvatarFallback,
  Progress,
  Skeleton,

  // Feedback
  Alert, AlertTitle, AlertDescription,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
  HoverCard, HoverCardTrigger, HoverCardContent,

  // Navigation
  Tabs, TabsList, TabsTrigger, TabsContent,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,

  // Overlays
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Popover, PopoverTrigger, PopoverContent,

  // Form elements
  Button,
  Label,
  Checkbox,
  RadioGroup, RadioGroupItem,
  Switch,
  Toggle,
  Textarea,
};

interface DynamicRendererProps {
  jsx: string;
}

export function DynamicRenderer({ jsx }: DynamicRendererProps) {
  const rendered = useMemo(() => {
    try {
      // Wrap JSX in a fragment if it doesn't start with < to handle multiple elements
      const wrappedJsx = jsx.trim();

      // Compile JSX to JS
      const compiled = transform(wrappedJsx, {
        transforms: ["jsx"],
        jsxRuntime: "classic",
        jsxPragma: "React.createElement",
        jsxFragmentPragma: "React.Fragment",
        production: true,
      }).code;

      // Create a function that has access to all components
      const scopeKeys = Object.keys(componentScope);
      const scopeValues = Object.values(componentScope);

      // The compiled output might be an expression or have variable declarations
      // Wrap it so it always returns the last expression
      const wrappedCode = `"use strict"; return (${compiled})`;

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function(...scopeKeys, wrappedCode);
      const element = fn(...scopeValues);

      return { element, error: null };
    } catch (firstErr) {
      // If expression mode failed, try as statements with explicit return
      try {
        const wrappedJsx = jsx.trim();
        const compiled = transform(`return (${wrappedJsx})`, {
          transforms: ["jsx"],
          jsxRuntime: "classic",
          jsxPragma: "React.createElement",
          jsxFragmentPragma: "React.Fragment",
          production: true,
        }).code;

        const scopeKeys = Object.keys(componentScope);
        const scopeValues = Object.values(componentScope);

        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const fn = new Function(...scopeKeys, `"use strict"; ${compiled}`);
        const element = fn(...scopeValues);

        return { element, error: null };
      } catch (secondErr) {
        const err = firstErr instanceof Error ? firstErr : secondErr;
        return { element: null, error: err instanceof Error ? err.message : "Unknown render error" };
      }
    }
  }, [jsx]);

  if (rendered.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Render Error</AlertTitle>
        <AlertDescription>
          <p className="mb-2">Failed to render this section:</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{rendered.error}</pre>
          <details className="mt-2">
            <summary className="text-xs cursor-pointer">View source</summary>
            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">{jsx}</pre>
          </details>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{rendered.element}</>;
}
