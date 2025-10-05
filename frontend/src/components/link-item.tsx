"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Copy, Clipboard } from "lucide-react";
import { ChangeEventHandler, ReactNode, useRef } from "react";
import { ClassNameValue } from "tailwind-merge";

type Props = {
  variant: "long" | "short";
  shortUrl: URL;
  longPlaceholder?: string;
  className?: ClassNameValue;
  onValueChange?: ChangeEventHandler<HTMLInputElement> | undefined;
};

const LinkItem = ({
  variant,
  shortUrl,
  longPlaceholder = "Paste long link here...",
  className,
  onValueChange,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const variants = {
    long: "text-muted-foreground font-normal truncate",
    short: "text-lg font-bold min-w-fit cursor-pointer hover:scale-105",
  } as const;

  const icons = {
    short: <Copy size={24} />,
    long: (
      <Button
        type="button"
        aria-label="Paste from clipboard"
        className="focus:outline-none cursor-pointer"
        variant="ghost"
        onClick={async () => {
          if (inputRef.current) {
            const text = await navigator.clipboard.readText();
            inputRef.current.value = text;
          }
        }}
      >
        <Clipboard size={24} />
      </Button>
    ),
  } as Record<typeof variant, ReactNode>;

  return (
    <div
      className={cn(
        "flex flex-row bg-neutral-50 gap-4 px-6 py-4 items-center justify-between text-foreground max-w-[500px] min-w-96 rounded-full transition-all duration-300 ease-in-out dark:bg-background dark:border-sidebar-border dark:border-1",
        variants[variant],
        className
      )}
    >
      {variant === "long" ? (
        <Input
          ref={inputRef}
          placeholder={longPlaceholder}
          onChange={onValueChange}
          className="[*]:bg-transparent [*]:ring-0 border-none resize-none text-2xl shadow-none"
          style={{ fontSize: 16 }}
        />
      ) : (
        <div className="flex flex-row gap-0 items-center">
          {shortUrl.origin}
          <span className="text-muted-foreground">{shortUrl.pathname}</span>
        </div>
      )}
      {icons[variant]}
    </div>
  );
};

export default LinkItem;
