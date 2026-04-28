export interface FilmeEstatistica {
    id: number;
    titulo: string;
    poster: string;
    media: number;
}

export interface UsuarioGeneroso {
    id: number;
    nome: string;
    nickname: string;
    foto_perfil: string;
    media_dada: number;
    total_avaliacoes: number;
}

export interface EstatisticasClube {
    clube: string;
    top_10: FilmeEstatistica[];
    pior_filme: FilmeEstatistica | null;
    mais_generosos: UsuarioGeneroso[];
}