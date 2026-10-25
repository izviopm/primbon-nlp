"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Root as Tabs, TabsContent, TabsList, TabsTrigger } from "@animate-ui/react/primitives/radix-ui/tabs";
import { spring } from "@/components/motion";
import { focus } from "@/components/ui";

/** Admin sections as Animate UI tabs; the panels are rendered on the server and passed in. */
export function AdminTabs({ tabs }: { tabs: { value: string; label: string; content: ReactNode }[] }) {
  const [aktif, setAktif] = useState(tabs[0].value);
  return (
    <Tabs value={aktif} onValueChange={setAktif} className="flex flex-col gap-4">
      <TabsList aria-label="Bagian admin" className="flex gap-1 self-start overflow-x-auto rounded-2xl border bg-card p-1 shadow-sm max-sm:w-full">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className={`relative min-h-11 shrink-0 cursor-pointer rounded-xl px-4 text-sm font-semibold transition-colors data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground ${focus}`}
          >
            {aktif === t.value && <motion.span layoutId="admin-tab" transition={spring} className="absolute inset-0 rounded-xl bg-primary-soft" />}
            <span className="relative">{t.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value} className={`rounded-2xl ${focus}`}>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
