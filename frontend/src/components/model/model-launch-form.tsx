"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useModelList, useLaunchModel } from "@/hooks/useModel"
import { Button } from "@/components/ui/button"
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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Loader2, Box } from "lucide-react"

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

const defaultValues: FormValues = {
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
}

interface ModelLaunchFormProps {
  clusterRunning: boolean
}

export function ModelLaunchForm({ clusterRunning }: ModelLaunchFormProps) {
  const [isToolUseOpen, setIsToolUseOpen] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const { data: modelList } = useModelList()
  const launchMutation = useLaunchModel()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onSubmit = async (values: FormValues) => {
    launchMutation.mutate(values)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Launch Model</CardTitle>
        </div>
        <CardDescription>
          Configure and launch a vLLM model on the cluster
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="model_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model ID</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model or enter custom ID" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modelList?.models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            <span className="text-muted-foreground text-xs">
                              ({model.quantization})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select from available models or enter a HuggingFace model ID
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
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
                        disabled={!clusterRunning}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of GPU shards for tensor parallelism
                    </FormDescription>
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
                        disabled={!clusterRunning}
                      />
                    </FormControl>
                    <FormDescription>
                      GPU memory utilization ratio
                    </FormDescription>
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
                  <FormDescription>
                    Maximum sequence length (leave empty for auto)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Collapsible open={isToolUseOpen} onOpenChange={setIsToolUseOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between p-0">
                  <span className="text-sm font-medium">Tool Use Configuration</span>
                  {isToolUseOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="enable_auto_tool_choice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto Tool Choice</FormLabel>
                          <FormDescription>
                            Enable automatic tool selection
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!clusterRunning}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tool_call_parser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tool Call Parser</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                </div>

                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="reasoning_parser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reasoning Parser</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between p-0">
                  <span className="text-sm font-medium">Advanced Configuration</span>
                  {isAdvancedOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="trust_remote_code"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Trust Remote Code</FormLabel>
                          <FormDescription>
                            Trust remote code for custom models
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!clusterRunning}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="load_format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Load Format</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                </div>

                <div className="mt-4">
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
                        <FormDescription>
                          Port for vLLM server (default: 8000)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              type="submit"
              className="w-full"
              disabled={!clusterRunning || launchMutation.isPending}
            >
              {launchMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Launching...
                </>
              ) : (
                <>Launch Model</>
              )}
            </Button>

            {launchMutation.isError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                Error: {launchMutation.error?.message || "Failed to launch model"}
              </div>
            )}

            {launchMutation.isSuccess && (
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm">
                {launchMutation.data?.message}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}