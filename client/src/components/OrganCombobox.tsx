import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Building2, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState } from "react";

type OrganComboboxProps = {
  organs: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
};

function searchKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function OrganCombobox({ organs, value, onChange, disabled, loading }: OrganComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredOrgans = query.trim() ? organs.filter(organ => searchKey(organ).includes(searchKey(query.trim()))) : organs;

  return (
    <Popover
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
          window.requestAnimationFrame(() => document.getElementById("orgao")?.focus());
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id="orgao"
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecionar órgão ou subprefeitura"
          disabled={disabled || loading}
          className={cn(
            "h-11 w-full justify-between rounded-xl border-line bg-white px-3.5 text-left font-normal shadow-none",
            "hover:bg-brand-50/60 focus-visible:border-brand-500 focus-visible:ring-brand-500/20",
            !value && "text-muted-foreground",
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Building2 className="size-4 shrink-0 text-brand-600" strokeWidth={1.8} />
            <span className="truncate">{value || (loading ? "Carregando órgãos…" : "Selecione um órgão")}</span>
          </span>
          {loading ? <Loader2 className="size-4 shrink-0 animate-spin text-brand-600" /> : <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
        onCloseAutoFocus={event => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Buscar por órgão ou subprefeitura…" />
          <CommandList className="max-h-72">
            <CommandEmpty>Nenhum órgão encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredOrgans.map(organ => (
                <CommandItem
                  key={organ}
                  value={organ}
                  onSelect={() => {
                    onChange(organ);
                    setOpen(false);
                    setQuery("");
                    window.requestAnimationFrame(() => document.getElementById("orgao")?.focus());
                  }}
                  className="cursor-pointer gap-2.5 px-3 py-2.5"
                >
                  <Check className={cn("size-4 shrink-0 text-brand-600", value === organ ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1">{organ}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
