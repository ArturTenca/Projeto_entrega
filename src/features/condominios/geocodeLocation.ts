import { geocodeAddress } from '@/lib/routing/geocode'
import type { Condominio } from '@/types/database'
import type { CondominioFormValues } from './CondominioForm'

export type CondominioPayload = Omit<
  Condominio,
  'id' | 'created_at' | 'updated_at'
>

function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, '')
}

async function lookupCepAddress(cep: string): Promise<string | null> {
  const digits = normalizeCep(cep)

  if (digits.length !== 8) {
    return null
  }

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as {
    erro?: boolean
    logradouro?: string
    bairro?: string
    localidade?: string
    uf?: string
  }

  if (data.erro || !data.localidade || !data.uf) {
    return null
  }

  const parts = [
    data.logradouro,
    data.bairro,
    `${data.localidade} - ${data.uf}`,
    'Brasil',
  ].filter(Boolean)

  return parts.join(', ')
}

export async function resolveCondominioPayload(
  values: CondominioFormValues,
): Promise<{ payload: CondominioPayload | null; error: string | null }> {
  const nome = values.nome.trim()
  const endereco = values.endereco.trim()
  const cep = normalizeCep(values.cep)

  if (!nome) {
    return { payload: null, error: 'Informe o nome do condomínio.' }
  }

  let finalEndereco = endereco
  let latitude: number | null = null
  let longitude: number | null = null

  if (cep) {
    if (cep.length !== 8) {
      return { payload: null, error: 'Informe um CEP válido com 8 dígitos.' }
    }

    const cepAddress = await lookupCepAddress(cep)

    if (!cepAddress) {
      return { payload: null, error: 'CEP não encontrado.' }
    }

    if (!finalEndereco) {
      finalEndereco = cepAddress
    }

    const coords = await geocodeAddress(
      endereco ? `${nome}, ${endereco}, ${cepAddress}` : `${nome}, ${cepAddress}`,
    )

    if (coords) {
      latitude = coords.lat
      longitude = coords.lng
    }
  } else if (finalEndereco) {
    const coords = await geocodeAddress(`${nome}, ${finalEndereco}`)

    if (coords) {
      latitude = coords.lat
      longitude = coords.lng
    }
  }

  if ((cep || finalEndereco) && (latitude === null || longitude === null)) {
    return {
      payload: null,
      error:
        'Não foi possível localizar o endereço no mapa. Confira o endereço ou o CEP.',
    }
  }

  return {
    payload: {
      nome,
      endereco: finalEndereco || null,
      latitude,
      longitude,
      observacoes: values.observacoes.trim() || null,
      ativo: values.ativo,
    },
    error: null,
  }
}
