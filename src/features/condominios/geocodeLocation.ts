import { cepDigits, isCompleteCep } from '@/lib/format/cep'
import { geocodeAddress, geocodeByCep } from '@/lib/routing/geocode'
import type { Condominio } from '@/types/database'
import type { CondominioFormValues } from './CondominioForm'

export type CondominioPayload = Omit<
  Condominio,
  'id' | 'created_at' | 'updated_at'
>

export type CepLookupResult = {
  endereco: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

export async function lookupCepAddress(
  cep: string,
): Promise<{ data: CepLookupResult | null; error: string | null }> {
  const digits = cepDigits(cep)

  if (digits.length === 0) {
    return { data: null, error: null }
  }

  if (!isCompleteCep(digits)) {
    return { data: null, error: 'CEP incompleto. Use o formato 00000-000.' }
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)

    if (!response.ok) {
      return { data: null, error: 'Não foi possível consultar o CEP.' }
    }

    const data = (await response.json()) as {
      erro?: boolean
      logradouro?: string
      bairro?: string
      localidade?: string
      uf?: string
    }

    if (data.erro || !data.localidade || !data.uf) {
      return { data: null, error: 'CEP não encontrado.' }
    }

    const parts = [
      data.logradouro,
      data.bairro,
      `${data.localidade} - ${data.uf}`,
    ].filter(Boolean)

    return {
      data: {
        endereco: parts.join(', '),
        logradouro: data.logradouro ?? '',
        bairro: data.bairro ?? '',
        cidade: data.localidade,
        uf: data.uf,
      },
      error: null,
    }
  } catch {
    return { data: null, error: 'Não foi possível consultar o CEP.' }
  }
}

export async function resolveCondominioPayload(
  values: CondominioFormValues,
): Promise<{ payload: CondominioPayload | null; error: string | null }> {
  const nome = values.nome.trim()
  const endereco = values.endereco.trim()
  const cep = cepDigits(values.cep)

  if (!nome) {
    return { payload: null, error: 'Informe o nome do condomínio.' }
  }

  if (!endereco && !cep) {
    return {
      payload: null,
      error: 'Informe o endereço ou um CEP válido (00000-000).',
    }
  }

  if (cep && !isCompleteCep(cep)) {
    return { payload: null, error: 'CEP incompleto. Use o formato 00000-000.' }
  }

  let finalEndereco = endereco
  let latitude: number | null = null
  let longitude: number | null = null
  let cepLookup: CepLookupResult | null = null

  if (cep) {
    const lookup = await lookupCepAddress(cep)

    if (lookup.error || !lookup.data) {
      return { payload: null, error: lookup.error ?? 'CEP não encontrado.' }
    }

    cepLookup = lookup.data

    if (!finalEndereco) {
      finalEndereco = cepLookup.endereco
    }
  }

  const geocodeQueries = [
    endereco && cepLookup
      ? `${nome}, ${endereco}, ${cepLookup.cidade} - ${cepLookup.uf}, ${cep}, Brasil`
      : null,
    cepLookup
      ? `${nome}, ${cepLookup.endereco}, ${cep}, Brasil`
      : null,
    finalEndereco ? `${nome}, ${finalEndereco}` : null,
  ].filter((query): query is string => Boolean(query))

  for (const query of geocodeQueries) {
    const coords = await geocodeAddress(query)
    if (coords) {
      latitude = coords.lat
      longitude = coords.lng
      break
    }
  }

  if (latitude === null && cep) {
    const coords = await geocodeByCep(cep)
    if (coords) {
      latitude = coords.lat
      longitude = coords.lng
    }
  }

  if ((cep || finalEndereco) && (latitude === null || longitude === null)) {
    return {
      payload: null,
      error:
        'Não foi possível localizar o endereço no mapa. Confira o CEP e o endereço.',
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
