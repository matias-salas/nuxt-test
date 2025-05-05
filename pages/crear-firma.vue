<script setup lang="ts">
import { ref, h } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, FieldArray } from 'vee-validate'
import { toast } from 'vue-sonner'
import * as z from 'zod'

/* -------------------------------------------------------------------------- */
/*                                  Schemas                                   */
/* -------------------------------------------------------------------------- */

/** Options de plantilla de ejemplo */
const templateOptions = [
  {
    label: 'Default',
    value: 'default',
    custom_logo_url: 'https://signitt.s3.us-east-1.amazonaws.com/imageedit_0_9653301761.png',
    custom_primary_color: '#050f40',
    custom_secondary_color: '#4a5565',
    custom_text_color: '#000000',
  },
  {
    label: 'Light',
    value: 'light',
    custom_logo_url: 'https://placehold.co/200x60?text=Logo',
    custom_primary_color: '#ffffff',
    custom_secondary_color: '#e2e8f0',
    custom_text_color: '#1a202c',
  },
  {
    label: 'Dark',
    value: 'dark',
    custom_logo_url: 'https://placehold.co/200x60?text=Logo+Dark',
    custom_primary_color: '#111827',
    custom_secondary_color: '#1f2937',
    custom_text_color: '#f9fafb',
  },
] as const

/** Firmante */
const signerSchema = z.object({
  national_id: z.string().min(6, 'DNI requerido'),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  signing_order: z.number().int().positive(),
  is_required_to_sign: z.boolean().default(true),
  signature_box_page: z.number().int().positive(),
  signature_box_x: z.number().int().nonnegative(),
  signature_box_y: z.number().int().nonnegative(),
  signature_box_width: z.number().int().positive(),
  signature_box_height: z.number().int().positive(),
  signature_box_all_pages: z.boolean(),
  send_email_notification: z.boolean(),
  send_sms_notification: z.boolean(),
  send_whatsapp_notification: z.boolean(),
  send_finish_email_notification: z.boolean(),
  send_finish_sms_notification: z.boolean(),
  send_finish_whatsapp_notification: z.boolean(),
  biometric: z.boolean(),
  allow_failed_biometric: z.boolean(),
  otp_type: z.enum(['email', 'whatsapp', 'sms']),
  otp_email: z.boolean().optional(),
  otp_whatsapp: z.boolean().optional(),
  otp_sms: z.boolean().optional(),
  validated_email: z.string().email().optional(),
  validated_phone: z.string().optional(),
})

/** Form principal */
const formSchema = toTypedSchema(
  z.object({
    /* Plantilla */
    selected_template: z.string(),
    custom_logo_url: z.string().url(),
    custom_primary_color: z.string(),
    custom_secondary_color: z.string(),
    custom_text_color: z.string(),

    /* Documento */
    document: z.any(),
    document_name: z.string().min(3),

    /* Firma */
    link_expiration_hours: z.number().int().positive(),
    location_required: z.boolean(),
    send_to_blockchain: z.boolean(),
    show_evidences: z.boolean(),
    signature_type: z.enum(['sequential', 'parallel']),
    redirect_url_success: z.string().url(),
    redirect_url_error: z.string().url(),
    redirect_url_reject: z.string().url(),
    terms_body: z.string().min(10),
    confirmation_text: z.string().min(3),

    /* Firmantes */
    signers: z.array(signerSchema).min(1, 'Al menos un firmante'),
  })
)

/* -------------------------------------------------------------------------- */
/*                                   Form                                     */
/* -------------------------------------------------------------------------- */

const { values, handleSubmit, setFieldValue } = useForm({
  validationSchema: formSchema,
  initialValues: {
    selected_template: 'default',
    ...templateOptions[0],
    link_expiration_hours: 24,
    location_required: true,
    send_to_blockchain: false,
    show_evidences: true,
    signature_type: 'sequential',
    signers: [],
  },
})

/** Actualiza colores/logo según plantilla seleccionada */
function onTemplateChange(val: string) {
  const tpl = templateOptions.find(t => t.value === val)
  if (!tpl) return
  setFieldValue('custom_logo_url', tpl.custom_logo_url)
  setFieldValue('custom_primary_color', tpl.custom_primary_color)
  setFieldValue('custom_secondary_color', tpl.custom_secondary_color)
  setFieldValue('custom_text_color', tpl.custom_text_color)
}

/** Convierte booleanos a "true"/"false" en profundidad */
function boolToString(obj: any): any {
  if (Array.isArray(obj)) return obj.map(boolToString)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === 'boolean' ? String(v) : boolToString(v)])
    )
  }
  return obj
}

const onSubmit = handleSubmit((formValues) => {
  const payload = boolToString(formValues)
  toast('Valores enviados', {
    description: h(
      'pre',
      { class: 'mt-2 w-[340px] rounded-md bg-slate-950 p-4 overflow-auto max-h-80' },
      h('code', { class: 'text-white text-xs' }, JSON.stringify(payload, null, 2))
    ),
  })
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Encabezado -->
    <div class="grid gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Crear firma</h2>
        <p class="text-muted-foreground">Completa los datos para generar un enlace de firma.</p>
      </div>
    </div>

    <!-- Formulario principal -->
    <form class="grid gap-4" @submit="onSubmit">
      <div class="grid md:grid-cols-2 gap-4">
        <!-- Seleccionar plantilla -->
        <Card class="w-full">
          <CardHeader>
            <CardTitle>Seleccionar plantilla</CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <FormField v-slot="{ componentField }" name="selected_template">
              <FormItem>
                <FormLabel>Plantilla</FormLabel>
                <FormControl>
                  <Select v-bind="componentField" @update:modelValue="onTemplateChange">
                    <SelectTrigger>
                      <SelectValue placeholder="Elige una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem v-for="opt in templateOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- Datos de documento -->
        <Card class="w-full">
          <CardHeader>
            <CardTitle>Datos de documento</CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <FormField v-slot="{ componentField }" name="document">
              <FormItem>
                <FormLabel>Cargar documento</FormLabel>
                <FormControl>
                  <Input type="file" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="document_name">
              <FormItem>
                <FormLabel>Nombre del documento</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Contrato de servicios" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>
      </div>

      <!-- Datos de firma -->
      <Card>
        <CardHeader>
          <CardTitle>Datos de firma</CardTitle>
        </CardHeader>
        <CardContent class="grid md:grid-cols-2 gap-6">
          <!-- Columna izquierda -->
          <div class="space-y-6">
            <FormField v-slot="{ componentField }" name="link_expiration_hours">
              <FormItem>
                <FormLabel>Horas de validez (expiración)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" type="checkbox" name="location_required">
              <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0">
                <FormControl>
                  <Checkbox :checked="value" @update:checked="handleChange" />
                </FormControl>
                <FormLabel>Solicitar ubicación</FormLabel>
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" type="checkbox" name="send_to_blockchain">
              <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0">
                <FormControl>
                  <Checkbox :checked="value" @update:checked="handleChange" />
                </FormControl>
                <FormLabel>Enviar a Blockchain</FormLabel>
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" type="checkbox" name="show_evidences">
              <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0">
                <FormControl>
                  <Checkbox :checked="value" @update:checked="handleChange" />
                </FormControl>
                <FormLabel>Mostrar evidencias al finalizar</FormLabel>
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="signature_type">
              <FormItem>
                <FormLabel>Tipo de firma</FormLabel>
                <FormControl>
                  <Select v-bind="componentField">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo de firma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="sequential">Firmantes consecutivos</SelectItem>
                        <SelectItem value="parallel">Firmantes simultáneos</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <!-- Columna derecha -->
          <div class="space-y-6">
            <FormField v-slot="{ componentField }" name="redirect_url_success">
              <FormItem>
                <FormLabel>URL de redirección (éxito)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://example.com/success" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="redirect_url_error">
              <FormItem>
                <FormLabel>URL de redirección (error)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://example.com/error" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="redirect_url_reject">
              <FormItem>
                <FormLabel>URL de redirección (rechazo)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://example.com/reject" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <div class="md:col-span-2 space-y-6">
            <FormField v-slot="{ componentField }" name="terms_body">
              <FormItem>
                <FormLabel>Términos y condiciones</FormLabel>
                <FormControl>
                  <Textarea rows="4" placeholder="Descripción de términos" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="confirmation_text">
              <FormItem>
                <FormLabel>Texto de confirmación</FormLabel>
                <FormControl>
                  <Textarea rows="3" placeholder="Texto de confirmación" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
        </CardContent>
      </Card>

      <!-- Firmantes -->
      <Card>
        <CardHeader>
          <CardTitle>Firmantes</CardTitle>
          <CardDescription>Añade uno o más firmantes.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <FieldArray name="signers" v-slot="{ fields, remove, push }">
            <!-- Listado compacto de firmantes existentes -->
            <div v-if="fields.length" class="grid gap-4">
              <Card v-for="(field, idx) in fields" :key="field.key" class="border-dashed">
                <CardHeader class="flex flex-row items-center justify-between py-3">
                  <div class="text-sm font-medium">
                    {{ field.value.first_name || 'Firmante' }} {{ field.value.last_name }} — DNI {{ field.value.national_id || '—' }}
                  </div>
                  <Button size="xs" variant="destructive" @click="remove(idx)">Eliminar</Button>
                </CardHeader>
                <CardContent class="grid md:grid-cols-3 gap-4">
                  <!-- Simplemente reusamos FormField con path signers[idx].campo -->
                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.national_id`">
                    <FormItem>
                      <FormLabel>DNI</FormLabel>
                      <FormControl>
                        <Input type="text" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.first_name`">
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input type="text" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.last_name`">
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input type="text" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.signing_order`">
                    <FormItem>
                      <FormLabel>Orden</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <!-- Posición y tamaño -->
                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.signature_box_page`">
                    <FormItem>
                      <FormLabel>Página</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.signature_box_x`">
                    <FormItem>
                      <FormLabel>Posición X</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.signature_box_y`">
                    <FormItem>
                      <FormLabel>Posición Y</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.signature_box_width`">
                    <FormItem>
                      <FormLabel>Ancho</FormLabel>
                      <FormControl>
                        <Input type="number" min="10" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.signature_box_height`">
                    <FormItem>
                      <FormLabel>Alto</FormLabel>
                      <FormControl>
                        <Input type="number" min="10" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <!-- Checkboxes extra -->
                  <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.signature_box_all_pages`" type="checkbox">
                    <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0 md:col-span-3">
                      <FormControl>
                        <Checkbox :checked="value" @update:checked="handleChange" />
                      </FormControl>
                      <FormLabel>Firma en todas las páginas</FormLabel>
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.send_email_notification`" type="checkbox">
                    <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0 md:col-span-3">
                      <FormControl>
                        <Checkbox :checked="value" @update:checked="handleChange" />
                      </FormControl>
                      <FormLabel>Enviar email de aviso de documento</FormLabel>
                    </FormItem>
                  </FormField>
                  <!-- (repetir checkboxes restantes de notificaciones, biometría, etc. para brevedad se omiten) -->

                  <!-- OTP -->
                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.otp_type`">
                    <FormItem>
                      <FormLabel>Método OTP</FormLabel>
                      <FormControl>
                        <Select v-bind="componentField">
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione OTP" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="whatsapp">Whatsapp</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.validated_email`" v-if="values.signers[idx]?.otp_type === 'email'">
                    <FormItem>
                      <FormLabel>Email válido</FormLabel>
                      <FormControl>
                        <Input type="email" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ componentField }" :name="`signers.${idx}.validated_phone`" v-if="values.signers[idx]?.otp_type !== 'email'">
                    <FormItem>
                      <FormLabel>Teléfono válido</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+5491131360772" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </CardContent>
              </Card>
            </div>

            <!-- Botón añadir firmante -->
            <Button variant="outline" @click="push({
              national_id: '',
              first_name: '',
              last_name: '',
              signing_order: fields.length + 1,
              is_required_to_sign: true,
              signature_box_page: 1,
              signature_box_x: 0,
              signature_box_y: 0,
              signature_box_width: 250,
              signature_box_height: 150,
              signature_box_all_pages: false,
              send_email_notification: true,
              send_sms_notification: false,
              send_whatsapp_notification: false,
              send_finish_email_notification: false,
              send_finish_sms_notification: false,
              send_finish_whatsapp_notification: false,
              biometric: false,
              allow_failed_biometric: false,
              otp_type: 'email',
              otp_email: true,
              otp_whatsapp: false,
              otp_sms: false,
              validated_email: '',
              validated_phone: '',
            })">
              Agregar firmante
            </Button>
          </FieldArray>
          
          <!-- Add FormMessage outside FieldArray but connected to the signers field -->
          <FormField v-slot="{ errorMessage }" name="signers">
            <FormMessage>{{ errorMessage }}</FormMessage>
          </FormField>
        </CardContent>
      </Card>

      <!-- Submit -->
      <div class="flex justify-end">
        <Button type="submit">Crear firma</Button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* sin estilos adicionales; se heredan los de shadcn-vue */
</style>
