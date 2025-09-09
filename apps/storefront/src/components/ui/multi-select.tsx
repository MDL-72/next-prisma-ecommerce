'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
   CommandSeparator,
} from '@/components/ui/command'
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
   Check as CheckIcon,
   ChevronsUpDown as ChevronsUpDownIcon,
   X as XIcon,
} from 'lucide-react'
import {
   type ComponentPropsWithoutRef,
   type ReactNode,
   createContext,
   useCallback,
   useContext,
   useEffect,
   useLayoutEffect,
   useRef,
   useState,
} from 'react'

type MultiSelectContextType = {
   open: boolean
   setOpen: (open: boolean) => void
   selectedValues: Set<string>
   toggleValue: (value: string) => void
   items: Map<string, ReactNode>
   onItemAdded: (value: string, label: ReactNode) => void
}

const MultiSelectContext = createContext<MultiSelectContextType | null>(null)

export function MultiSelect({
   children,
   values,
   defaultValues,
   onValuesChange,
}: {
   children: ReactNode
   values?: string[]
   defaultValues?: string[]
   onValuesChange?: (values: string[]) => void
}) {
   const [open, setOpen] = useState(false)
   // Safe default (avoid passing undefined to Set)
   const [selectedValues, setSelectedValues] = useState<Set<string>>(
      new Set<string>(defaultValues ?? [])
   )
   const [items, setItems] = useState<Map<string, ReactNode>>(new Map())

   // If moving from uncontrolled to controlled, keep internal mirror in sync (not strictly required, but prevents odd toggles)
   useEffect(() => {
      if (values) setSelectedValues(new Set(values))
   }, [values])

   const toggleValue = useCallback(
      (value: string) => {
         setSelectedValues((prev) => {
            // In controlled mode, derive from props; in uncontrolled, derive from prev
            const base = values ? new Set(values) : prev
            const next = new Set(base)
            if (next.has(value)) next.delete(value)
            else next.add(value)

            // Notify parent (always)
            onValuesChange?.([...next])

            // In controlled mode, parent will update `values`; keep our internal state unchanged
            return values ? prev : next
         })
      },
      [values, onValuesChange]
   )

   const onItemAdded = useCallback((value: string, label: ReactNode) => {
      setItems((prev) => {
         if (prev.get(value) === label) return prev
         const copy = new Map(prev)
         copy.set(value, label)
         return copy
      })
   }, [])

   return (
      <MultiSelectContext.Provider
         value={{
            open,
            setOpen,
            selectedValues: values ? new Set(values) : selectedValues,
            toggleValue,
            items,
            onItemAdded,
         }}
      >
         <Popover open={open} onOpenChange={setOpen}>
            {children}
         </Popover>
      </MultiSelectContext.Provider>
   )
}

export function MultiSelectTrigger({
   className,
   children,
   ...props
}: {
   className?: string
   children?: ReactNode
} & ComponentPropsWithoutRef<typeof Button>) {
   const { open } = useMultiSelectContext()

   return (
      <PopoverTrigger asChild>
         <Button
            {...props}
            variant={props.variant ?? 'outline'}
            role={props.role ?? 'combobox'}
            aria-expanded={props['aria-expanded'] ?? open}
            className={cn(
               "flex h-auto min-h-9 w-fit items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-transparent px-3 py-1.5 text-sm whitespace-nowrap shadow-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
               className
            )}
         >
            {children}
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
         </Button>
      </PopoverTrigger>
   )
}

export function MultiSelectValue({
   placeholder,
   clickToRemove = true,
   className,
   overflowBehavior = 'wrap-when-open',
   ...props
}: {
   placeholder?: string
   clickToRemove?: boolean
   overflowBehavior?: 'wrap' | 'wrap-when-open' | 'cutoff'
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>) {
   const { selectedValues, toggleValue, items, open } = useMultiSelectContext()
   const [overflowAmount, setOverflowAmount] = useState(0)
   const valueRef = useRef<HTMLDivElement | null>(null)
   //    const overflowRef = useRef<HTMLDivElement | null>(null)
   const overflowWrapperRef = useRef<HTMLSpanElement | null>(null)

   const shouldWrap =
      overflowBehavior === 'wrap' ||
      (overflowBehavior === 'wrap-when-open' && open)

   const checkOverflow = useCallback(() => {
      const containerElement = valueRef.current
      const overflowElement = overflowWrapperRef.current
      if (!containerElement) return

      const chips = containerElement.querySelectorAll<HTMLElement>(
         '[data-selected-item]'
      )

      if (overflowElement) overflowElement.style.display = 'none'
      chips.forEach((child) => child.style.removeProperty('display'))

      let amount = 0
      for (let i = chips.length - 1; i >= 0; i--) {
         const child = chips[i]
         if (containerElement.scrollWidth <= containerElement.clientWidth) break
         amount = chips.length - i
         child.style.display = 'none'
         if (overflowElement) overflowElement.style.removeProperty('display')
      }
      setOverflowAmount(amount)
   }, [])

   useLayoutEffect(() => {
      checkOverflow()
   }, [selectedValues, checkOverflow, shouldWrap])

   const handleResize = useCallback(
      (node: HTMLDivElement | null) => {
         if (!node) return
         valueRef.current = node
         const observer = new ResizeObserver(checkOverflow)
         observer.observe(node)
         return () => {
            observer.disconnect()
            if (valueRef.current === node) valueRef.current = null
         }
      },
      [checkOverflow]
   )

   if (selectedValues.size === 0 && placeholder) {
      return (
         <span className="min-w-0 overflow-hidden font-normal text-muted-foreground">
            {placeholder}
         </span>
      )
   }

   return (
      <div
         {...props}
         ref={handleResize}
         className={cn(
            'flex w-full gap-1.5 overflow-hidden',
            shouldWrap && 'h-full flex-wrap',
            className
         )}
      >
         {[...selectedValues]
            .filter((v) => items.has(v))
            .map((v) => (
               <Badge
                  variant="outline"
                  data-selected-item
                  className="group flex items-center gap-1"
                  key={v}
                  onClick={
                     clickToRemove
                        ? (e) => {
                             e.stopPropagation()
                             toggleValue(v)
                          }
                        : undefined
                  }
               >
                  {items.get(v)}
                  {clickToRemove && (
                     <XIcon className="size-2 text-muted-foreground group-hover:text-destructive" />
                  )}
               </Badge>
            ))}
         <span
            ref={overflowWrapperRef}
            style={{
               display:
                  overflowAmount > 0 && !shouldWrap ? 'inline-flex' : 'none',
            }}
            className="inline-flex"
         >
            <Badge variant="outline">+{overflowAmount}</Badge>
         </span>
      </div>
   )
}

export function MultiSelectContent({
   search = true,
   children,
   ...props
}: {
   search?: boolean | { placeholder?: string; emptyMessage?: string }
   children: ReactNode
} & Omit<ComponentPropsWithoutRef<typeof Command>, 'children'>) {
   const canSearch = typeof search === 'object' ? true : search

   return (
      <>
         {/* Pre-render to collect item labels for badge display */}
         <div style={{ display: 'none' }}>
            <Command>
               <CommandList>{children}</CommandList>
            </Command>
         </div>

         <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0">
            <Command {...props}>
               {canSearch ? (
                  <CommandInput
                     placeholder={
                        typeof search === 'object'
                           ? search.placeholder
                           : undefined
                     }
                  />
               ) : (
                  <button autoFocus className="sr-only" />
               )}
               <CommandList>
                  {canSearch && (
                     <CommandEmpty>
                        {typeof search === 'object'
                           ? search.emptyMessage
                           : undefined}
                     </CommandEmpty>
                  )}
                  {children}
               </CommandList>
            </Command>
         </PopoverContent>
      </>
   )
}

export function MultiSelectItem({
   value,
   children,
   badgeLabel,
   onSelect,
   ...props
}: {
   badgeLabel?: ReactNode
   value: string
} & Omit<ComponentPropsWithoutRef<typeof CommandItem>, 'value'>) {
   const { toggleValue, selectedValues, onItemAdded } = useMultiSelectContext()
   const isSelected = selectedValues.has(value)

   useEffect(() => {
      onItemAdded(value, badgeLabel ?? children)
   }, [value, children, onItemAdded, badgeLabel])

   return (
      <CommandItem
         {...props}
         value={value}
         onSelect={(v) => {
            toggleValue(v)
            onSelect?.(v)
         }}
      >
         <CheckIcon
            className={cn(
               'mr-2 size-4',
               isSelected ? 'opacity-100' : 'opacity-0'
            )}
         />
         {children}
      </CommandItem>
   )
}

export function MultiSelectGroup(
   props: ComponentPropsWithoutRef<typeof CommandGroup>
) {
   return <CommandGroup {...props} />
}

export function MultiSelectSeparator(
   props: ComponentPropsWithoutRef<typeof CommandSeparator>
) {
   return <CommandSeparator {...props} />
}

function useMultiSelectContext() {
   const context = useContext(MultiSelectContext)
   if (context == null) {
      throw new Error(
         'useMultiSelectContext must be used within a MultiSelectContext'
      )
   }
   return context
}
