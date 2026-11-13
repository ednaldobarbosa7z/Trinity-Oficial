export interface User {
  id: number;
  nome: string;
  nickname: string;
  email?: string;
  url_foto_perfil: string | null;
  has_club?: boolean;
}
export interface Session {
  token: string;
  user: User;
}
export interface Club {
  id: number;
  nome: string;
  descricao: string | null;
  codigo_acesso: string;
  foto_clube: string | null;
  discord_configurado: boolean;
}
export type CycleStatus = 'ABERTO' | 'FECHADO' | 'AGUARDANDO';
export interface Film {
  id: number;
  titulo: string;
  sinopse: string | null;
  ano_lancamento: string | null;
  url_poster: string | null;
  url_backdrop: string | null;
  tmdb_id: string | null;
  url_link_externo?: string | null;
}
export interface Meeting {
  id: number;
  titulo: string;
  data_hora: string;
  tipo: 'Online' | 'Presencial';
  link_ou_local: string | null;
}
export interface Slot {
  id: number;
  posicao: number;
  user: User | null;
  filme: Film | null;
  minha_avaliacao?: { id: number; nota: number } | null;
}
export interface Cycle {
  id: number;
  mes: number;
  ano: number;
  tema: string | null;
  status: CycleStatus;
  qtd_slots: number;
  slots?: Slot[];
}
export interface CurrentCycle extends Omit<Cycle, 'qtd_slots' | 'slots'> {
  slots: Slot[];
  reunioes: Meeting[];
}
export interface CycleDetails {
  id?: number;
  existe?: boolean;
  tema: string | null;
  status: CycleStatus;
  slots: {
    id: number;
    posicao: number;
    user: User | null;
    filme: { id: number; titulo: string; poster: string | null } | null;
  }[];
}
export interface Activity {
  tipo: 'indicacao' | 'avaliacao';
  user_id: number | null;
  user: string;
  avatar: string | null;
  filme: string;
  data: string;
  nota?: number;
}
export interface Dashboard {
  clube: Club;
  membros: User[];
  sou_admin: boolean;
  meu_id: number;
  ciclo_atual: CurrentCycle | null;
  atividades: Activity[];
}
export interface Page<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
}
export interface Review {
  id: number;
  nota: number;
  comentario: string;
  destaque: string | null;
  recado_indicacao?: string | null;
  assistiria_novamente: boolean;
  created_at: string;
  user: User;
  curtidas_count: number;
  curtido_por_mim: boolean;
}
export interface CatalogFilm {
  id: number;
  titulo: string;
  ano: string | null;
  poster: string | null;
  backdrop: string | null;
  sinopse: string | null;
  indicado_por: { id: number | null; nickname: string };
  stats: {
    media_geral: number;
    total_avaliacoes: number;
    porcentagem_rewatch: number;
    is_polemico: boolean;
  };
}
export interface CatalogCycle {
  mes: number;
  ano: number;
  tema: string | null;
  filmes: CatalogFilm[];
}
export interface Profile {
  user: User;
  clube: { nome: string; codigo: string } | null;
  amigos: User[];
  conquistas: { primeiro_play: boolean; cinefilo_veterano: boolean; curador_polemico: boolean };
  stats: { total_avaliacoes: number; total_filmes_assistidos: number };
  pagination: { page: number; per_page: number; total_avaliacoes: number; total_recados?: number };
  recados_recebidos: {
    id: number;
    autor: string;
    filme_titulo: string;
    nota: number;
    texto: string;
  }[];
  avaliacoes: {
    id: number;
    nota: number;
    comentario: string;
    destaque: string | null;
    assistiria_novamente: boolean;
    created_at: string;
    filme: { titulo: string; poster: string | null; ano: string | null };
  }[];
}
export interface FilmStats {
  id: number;
  titulo: string;
  poster: string | null;
  media: number;
}
export interface Statistics {
  clube: string;
  top_10: FilmStats[];
  pior_filme: FilmStats | null;
  mais_generosos: {
    id: number;
    nome: string;
    nickname: string;
    foto_perfil: string | null;
    media_dada: number;
    total_avaliacoes: number | string;
  }[];
}
export interface TmdbFilm {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
}
export interface TmdbResults {
  results: TmdbFilm[];
  page: number;
  total_pages: number;
  total_results: number;
}
export interface ReviewInput {
  filme_id: number;
  ciclo_id: number;
  nota: number;
  comentario: string;
  destaque: string;
  recado_indicacao: string;
  assistiria_novamente: boolean;
}
export interface CycleInput {
  mes: number;
  ano: number;
  qtd_slots: number;
  tema: string;
}
export interface RegisterInput {
  nome: string;
  nickname: string;
  email: string;
  password: string;
  password_confirmation: string;
}
