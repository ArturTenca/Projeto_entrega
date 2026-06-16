export type DiaSemana =
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado'

export type PedidoStatus = 'ativo' | 'pausado' | 'cancelado'

export type EntregaStatus = 'pendente' | 'separado' | 'em_rota' | 'entregue'

export type UserRole = 'organizador' | 'entregador'

export type ThemeMode = 'light' | 'dark'

export interface Produto {
  id: string
  nome: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Condominio {
  id: string
  nome: string
  endereco: string | null
  latitude: number | null
  longitude: number | null
  observacoes: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nome: string
  telefone: string | null
  endereco: string | null
  condominio_id: string | null
  produto_favorito_id: string | null
  quantidade_favorita: number | null
  observacoes: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Pedido {
  id: string
  cliente_id: string
  produto_id: string | null
  quantidade: number
  dia_semana: DiaSemana
  status: PedidoStatus
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Entrega {
  id: string
  pedido_id: string
  data_prevista: string
  quantidade: number
  status: EntregaStatus
  observacoes: string | null
  entregue_em: string | null
  entregue_por: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  role: UserRole
  theme: ThemeMode
  created_at: string
  updated_at: string
}

export interface ClienteComCondominio extends Cliente {
  condominios: Pick<Condominio, 'id' | 'nome'> | null
  produto_favorito: Pick<Produto, 'id' | 'nome'> | null
}

export interface PedidoComCliente extends Pedido {
  produtos: Pick<Produto, 'id' | 'nome'> | null
  clientes: Pick<
    Cliente,
    | 'id'
    | 'nome'
    | 'telefone'
    | 'endereco'
    | 'condominio_id'
    | 'produto_favorito_id'
    | 'quantidade_favorita'
  > & {
    condominios: Pick<Condominio, 'id' | 'nome' | 'endereco' | 'latitude' | 'longitude'> | null
    produto_favorito: Pick<Produto, 'id' | 'nome'> | null
  }
}

export interface EntregaComDetalhes extends Entrega {
  pedidos: PedidoComCliente
}

export const DIA_SEMANA_LABEL: Record<DiaSemana, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
}

export const ENTREGA_STATUS_LABEL: Record<EntregaStatus, string> = {
  pendente: 'Pendente',
  separado: 'Separado',
  em_rota: 'Em rota',
  entregue: 'Entregue',
}

export const PEDIDO_STATUS_LABEL: Record<PedidoStatus, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  cancelado: 'Cancelado',
}

export interface Database {
  public: {
    Tables: {
      condominios: {
        Row: Condominio
        Insert: Omit<Condominio, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Condominio>
        Relationships: []
      }
      clientes: {
        Row: Cliente
        Insert: Omit<Cliente, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Cliente>
        Relationships: []
      }
      pedidos: {
        Row: Pedido
        Insert: Omit<Pedido, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Pedido>
        Relationships: []
      }
      entregas: {
        Row: Entrega
        Insert: Omit<Entrega, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Entrega>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Profile>
        Relationships: []
      }
      produtos: {
        Row: Produto
        Insert: Omit<Produto, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Produto>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      dia_semana: DiaSemana
      pedido_status: PedidoStatus
      entrega_status: EntregaStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
