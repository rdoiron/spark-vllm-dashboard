"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCreateProfile, useUpdateProfile, useModelList } from "@/hooks/useProfiles"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Box } from "lucide-react"

const toolCallParsers = [
  { value: "glm47", label: "GLM-4.7" },
  { value: "minimax_m2", label: "MiniMax M2" },
  { value: "hermes", label: "Hermes" },
  { value: "mistral", label: "Mistral" },
]

const reasoningParsers = [
  { value: "none", label: "None" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "qwen", label: "Qwen" },
]

const loadFormats = [
  { value: "auto", label: "Auto" },
  { value: "pt", label: "PyTorch (pt)" },
  { value: "safetensors", label: "Safetensors" },
  { value: "npcache", label: "NP Cache" },
  { value: "dummy", label: "Dummy" },
]

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  model_id: z.string().min(1, "Model ID is required"),
  tensor_parallel: z.number().min(1).max(8),
  gpu_memory_utilization: z.number().min(0.1).max(1.0),
  max_model_len: z.number().optional(),
  enable_auto_tool_choice: z.boolean(),
  tool_call_parser: z.string().optional(),
  reasoning_parser: z.string().optional(),
  trust_remote_code: z.boolean(),
  load_format: z.string().optional(),
  port: z.number().min(1024).max(65535),
})

type FormValues = z.infer<typeof formSchema>

interface ProfileFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: {
    id: string
    name: string
    description: string | null
    model_id: string
    config: {
      model_id: string
      tensor_parallel: number
      gpu_memory_utilization: number
      max_model_len?: number
      enable_auto_tool_choice: boolean
      tool_call_parser?: string
      reasoning_parser?: string
      trust_remote_code: boolean
      load_format?: string
      port: number
    }
    favorite: boolean
  } | null
}

export function ProfileFormDialog({ open, onOpenChange, profile }: ProfileFormDialogProps) {
  const isEditing = profile !== null

  const { data: modelList } = useModelList()
  const createMutation = useCreateProfile()
  const updateMutation = useUpdateProfile()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      model_id: "",
      tensor_parallel: 1,
      gpu_memory_utilization: 0.9,
      max_model_len: undefined,
      enable_auto_tool_choice: false,
      tool_call_parser: undefined,
      reasoning_parser: undefined,
      trust_remote_code: true,
      load_format: "auto",
      port: 8000,
    },
  })

  form.register("description")

  const onSubmit = async (values: FormValues) => {
    const config = {
      model_id: values.model_id,
      tensor_parallel: values.tensor_parallel,
      gpu_memory_utilization: values.gpu_memory_utilization,
      max_model_len: values.max_model_len,
      enable_auto_tool_choice: values.enable_auto_tool_choice,
      tool_call_parser: values.tool_call_parser,
      reasoning_parser: values.reasoning_parser,
      trust_remote_code: values.trust_remote_code,
      load_format: values.load_format,
      port: values.port,
    }

    const data = {
      name: values.name,
      description: values.description,
      model_id: values.model_id,
      config,
      favorite: profile?.favorite || false,
    }

    if (isEditing && profile) {
      updateMutation.mutate(
        { id: profile.id, data },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onOpenChange(false)
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>{isEditing ? "Edit Profile" : "Create Profile"}</DialogTitle>
          </div>
          <DialogDescription>
            {isEditing
              ? "Update the profile configuration below."
              : "Create a new model configuration profile."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Profile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model ID</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelList?.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this profile..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tensor_parallel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tensor Parallel: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={4}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormDescription>Number of GPU shards</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gpu_memory_utilization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPU Memory: {Math.round(field.value * 100)}%</FormLabel>
                    <FormControl>
                      <Slider
                        min={0.5}
                        max={0.95}
                        step={0.05}
                        defaultValue={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="max_model_len"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Model Length (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 32768"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val ? Number(val) : undefined)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="enable_auto_tool_choice"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto Tool Choice</FormLabel>
                      <FormDescription>Enable automatic tool selection</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trust_remote_code"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Trust Remote Code</FormLabel>
                      <FormDescription>Trust remote code for custom models</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tool_call_parser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool Call Parser</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parser" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {toolCallParsers.map((parser) => (
                          <SelectItem key={parser.value} value={parser.value}>
                            {parser.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reasoning_parser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reasoning Parser</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parser" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reasoningParsers.map((parser) => (
                          <SelectItem key={parser.value} value={parser.value}>
                            {parser.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="load_format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Load Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}