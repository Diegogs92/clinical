"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    LayoutDashboard,
    LogOut,
    Moon,
    Sun
} from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useAuth } from "@/contexts/AuthContext"

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { toggleTheme } = useTheme()
    const { signOut } = useAuth()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Command Menu"
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white/90 shadow-2xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-gray-200 px-3 dark:border-gray-800">
                    <Command.Input
                        placeholder="Escriba un comando o busque..."
                        className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100"
                    />
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    <Command.Empty className="py-6 text-center text-sm text-gray-500">
                        No se encontraron resultados.
                    </Command.Empty>

                    <Command.Group heading="Navegación" className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/dashboard"))}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-100 transition-colors"
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/dashboard/patients"))}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-100 transition-colors"
                        >
                            <Smile className="mr-2 h-4 w-4" />
                            <span>Pacientes</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/dashboard/calendar"))}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-100 transition-colors"
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Agenda</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="General" className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => toggleTheme())}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-100 transition-colors"
                        >
                            <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="ml-6 dark:ml-0">Cambiar Tema</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/settings"))}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-100 transition-colors"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configuración</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => signOut())}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-100 transition-colors"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>

                <div className="border-t border-gray-200 px-4 py-2 text-[10px] text-gray-500 dark:border-gray-800">
                    Presiona <kbd className="rounded border bg-gray-100 px-1 font-mono text-xs dark:bg-gray-800">Esc</kbd> para cerrar
                </div>
            </div>
        </Command.Dialog>
    )
}
