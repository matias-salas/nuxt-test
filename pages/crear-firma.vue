<script setup lang="ts">
import { ref, h, computed, watch } from 'vue'
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
/*                               Datos de Ejemplo                             */
/* -------------------------------------------------------------------------- */

/** Lista de firmantes disponibles para seleccionar */
const availableSigners = ref([
  { id: 1, national_id: '12345678', first_name: 'Juan', last_name: 'Pérez' },
  { id: 2, national_id: '87654321', first_name: 'María', last_name: 'González' },
  { id: 3, national_id: '23456789', first_name: 'Carlos', last_name: 'López' },
  { id: 4, national_id: '34567890', first_name: 'Laura', last_name: 'Martínez' },
  { id: 5, national_id: '45678901', first_name: 'Roberto', last_name: 'Fernández' },
  { id: 6, national_id: '56789012', first_name: 'Ana', last_name: 'Rodríguez' },
  { id: 7, national_id: '67890123', first_name: 'Diego', last_name: 'Sánchez' },
  { id: 8, national_id: '78901234', first_name: 'Sofía', last_name: 'Torres' },
])

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

/** Estado para controlar la visibilidad del diálogo de selección de firmantes */
const showSignerDialog = ref(false)

/** Estado para la búsqueda de firmantes */
const signerSearchQuery = ref('')
const selectedSignerId = ref<number | null>(null)

/** Firmantes filtrados por búsqueda */
const filteredSigners = computed(() => {
  const query = signerSearchQuery.value.toLowerCase().trim()
  if (!query) return availableSigners.value
  
  return availableSigners.value.filter(signer => 
    signer.national_id.toLowerCase().includes(query) || 
    signer.first_name.toLowerCase().includes(query) || 
    signer.last_name.toLowerCase().includes(query)
  )
})

/** Abre el diálogo de selección de firmantes */
function openSignerDialog() {
  signerSearchQuery.value = ''
  selectedSignerId.value = null
  showSignerDialog.value = true
}

/** Cierra el diálogo de selección de firmantes */
function closeSignerDialog() {
  showSignerDialog.value = false
}

/** Agrega un firmante seleccionado al formulario */
function addSelectedSigner(signerId: number, pushFn: Function) {
  const signer = availableSigners.value.find(s => s.id === signerId)
  if (!signer) return
  
  const signerData = {
    national_id: signer.national_id,
    first_name: signer.first_name,
    last_name: signer.last_name,
    signing_order: values.signers.length + 1,
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
  }
  
  // Usar la función push proporcionada por FieldArray para agregar el firmante
  pushFn(signerData)
  closeSignerDialog()
}
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
            <div v-if="fields.length" class="grid gap-4 mb-6">
              <Card v-for="(field, idx) in fields" :key="field.key" class="border-dashed">
                <CardHeader class="flex flex-row items-center justify-between py-3">
                  <div class="text-sm font-medium">
                    {{ field.value.first_name || 'Firmante' }} {{ field.value.last_name }} — DNI {{ field.value.national_id || '—' }}
                  </div>
                  <Button type="button" size="xs" variant="destructive" @click="remove(idx)">Eliminar</Button>
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

                  <!-- Reemplazar checkboxes individuales por selects múltiples para notificaciones -->
                  <div class="md:col-span-3 space-y-4 border rounded-md p-4">
                    <h4 class="font-medium text-sm mb-2">Enviar aviso de documento para firma</h4>
                    <div class="grid md:grid-cols-3 gap-2">
                      <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.send_email_notification`" type="checkbox">
                        <FormItem class="flex items-center gap-x-2 space-y-0">
                          <FormControl>
                            <Checkbox :checked="value" @update:checked="handleChange" />
                          </FormControl>
                          <FormLabel class="font-normal">Email</FormLabel>
                        </FormItem>
                      </FormField>

                      <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.send_sms_notification`" type="checkbox">
                        <FormItem class="flex items-center gap-x-2 space-y-0">
                          <FormControl>
                            <Checkbox :checked="value" @update:checked="handleChange" />
                          </FormControl>
                          <FormLabel class="font-normal">SMS</FormLabel>
                        </FormItem>
                      </FormField>

                      <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.send_whatsapp_notification`" type="checkbox">
                        <FormItem class="flex items-center gap-x-2 space-y-0">
                          <FormControl>
                            <Checkbox :checked="value" @update:checked="handleChange" />
                          </FormControl>
                          <FormLabel class="font-normal">WhatsApp</FormLabel>
                        </FormItem>
                      </FormField>
                    </div>
                  </div>

                  <div class="md:col-span-3 space-y-4 border rounded-md p-4">
                    <h4 class="font-medium text-sm mb-2">Enviar aviso de documento firmado</h4>
                    <div class="grid md:grid-cols-3 gap-2">
                      <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.send_finish_email_notification`" type="checkbox">
                        <FormItem class="flex items-center gap-x-2 space-y-0">
                          <FormControl>
                            <Checkbox :checked="value" @update:checked="handleChange" />
                          </FormControl>
                          <FormLabel class="font-normal">Email</FormLabel>
                        </FormItem>
                      </FormField>

                      <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.send_finish_sms_notification`" type="checkbox">
                        <FormItem class="flex items-center gap-x-2 space-y-0">
                          <FormControl>
                            <Checkbox :checked="value" @update:checked="handleChange" />
                          </FormControl>
                          <FormLabel class="font-normal">SMS</FormLabel>
                        </FormItem>
                      </FormField>

                      <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.send_finish_whatsapp_notification`" type="checkbox">
                        <FormItem class="flex items-center gap-x-2 space-y-0">
                          <FormControl>
                            <Checkbox :checked="value" @update:checked="handleChange" />
                          </FormControl>
                          <FormLabel class="font-normal">WhatsApp</FormLabel>
                        </FormItem>
                      </FormField>
                    </div>
                  </div>

                  <!-- Biometría -->
                  <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.biometric`" type="checkbox">
                    <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0 md:col-span-3">
                      <FormControl>
                        <Checkbox :checked="value" @update:checked="handleChange" />
                      </FormControl>
                      <FormLabel>Requerir verificación biométrica</FormLabel>
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.allow_failed_biometric`" type="checkbox">
                    <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0 md:col-span-3">
                      <FormControl>
                        <Checkbox :checked="value" @update:checked="handleChange" />
                      </FormControl>
                      <FormLabel>Permitir firma en caso de verificación biométrica fallida</FormLabel>
                    </FormItem>
                  </FormField>

                  <!-- OTP adicionales -->
                  <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.otp_email`" type="checkbox" v-if="values.signers[idx]?.otp_type === 'email'">
                    <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0 md:col-span-3">
                      <FormControl>
                        <Checkbox :checked="value" @update:checked="handleChange" />
                      </FormControl>
                      <FormLabel>Usar OTP por Email</FormLabel>
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.otp_whatsapp`" type="checkbox" v-if="values.signers[idx]?.otp_type === 'whatsapp'">
                    <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0 md:col-span-3">
                      <FormControl>
                        <Checkbox :checked="value" @update:checked="handleChange" />
                      </FormControl>
                      <FormLabel>Usar OTP por WhatsApp</FormLabel>
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ value, handleChange }" :name="`signers.${idx}.otp_sms`" type="checkbox" v-if="values.signers[idx]?.otp_type === 'sms'">
                    <FormItem class="flex items-start gap-x-3 border rounded-md p-4 space-y-0 md:col-span-3">
                      <FormControl>
                        <Checkbox :checked="value" @update:checked="handleChange" />
                      </FormControl>
                      <FormLabel>Usar OTP por SMS</FormLabel>
                    </FormItem>
                  </FormField>

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

            <!-- Botón para abrir el diálogo de selección de firmantes -->
            <Button type="button" variant="outline" @click="openSignerDialog">
              Agregar firmante
            </Button>

            <!-- Diálogo de selección de firmantes -->
            <Dialog :open="showSignerDialog" @update:open="showSignerDialog = $event">
              <DialogContent class="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Seleccionar firmante</DialogTitle>
                  <DialogDescription>
                    Busca y selecciona un firmante para agregar al documento.
                  </DialogDescription>
                </DialogHeader>
                <div class="py-4 space-y-4">
                  <div class="space-y-2">
                    <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Buscar firmante
                    </label>
                    <div class="relative">
                      <Input
                        type="text"
                        placeholder="Buscar firmante por nombre o DNI"
                        v-model="signerSearchQuery"
                        class="mb-1"
                        autofocus
                      />
                      <div v-if="filteredSigners.length > 0" class="max-h-60 overflow-y-auto space-y-1 mt-2">
                        <div 
                          v-for="signer in filteredSigners" 
                          :key="signer.id" 
                          class="p-2 border rounded-md hover:bg-slate-100 cursor-pointer"
                          @click="addSelectedSigner(signer.id, push)"
                        >
                          <div class="font-medium">{{ signer.first_name }} {{ signer.last_name }}</div>
                          <div class="text-sm text-gray-600">DNI: {{ signer.national_id }}</div>
                        </div>
                      </div>
                      <div v-else-if="signerSearchQuery && filteredSigners.length === 0" class="p-2 text-gray-600">
                        No se encontraron firmantes
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" @click="closeSignerDialog">Cancelar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </FieldArray>
          
          <!-- Fix: Wrap FormMessage inside FormItem -->
          <FormField v-slot="{ errorMessage }" name="signers">
            <FormItem>
              <FormMessage>{{ errorMessage }}</FormMessage>
            </FormItem>
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
