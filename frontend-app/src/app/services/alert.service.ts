import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class AlertService {

    constructor() { }

    // Configuração padrão para o Tema Dark/Neon
    private readonly darkConfig = {
        background: '#1e1e1e', // Fundo cinza escuro
        color: '#e0e0e0',      // Texto claro
        confirmButtonColor: '#007bff', // Azul (igual seus botões)
        cancelButtonColor: '#d33',     // Vermelho
        customClass: {
            popup: 'neon-border' // Classe CSS que vamos criar depois
        }
    };

    // 1. Mensagem de Sucesso (Substitui o alert simples)
    sucesso(titulo: string, texto?: string) {
        return Swal.fire({
            ...this.darkConfig,
            icon: 'success',
            title: titulo,
            text: texto,
            timer: 2000, // Fecha sozinho em 2 segundos
            showConfirmButton: false
        });
    }

    // 2. Mensagem de Erro
    erro(texto: string) {
        return Swal.fire({
            ...this.darkConfig,
            icon: 'error',
            title: 'Ops!',
            text: texto
        });
    }

    // 3. Confirmação (Substitui o confirm nativo)
    confirmar(titulo: string, texto: string, textoBotao: string = 'Sim, deletar'): Promise<any> {
        return Swal.fire({
            ...this.darkConfig,
            title: titulo,
            text: texto,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: textoBotao,
            cancelButtonText: 'Cancelar',
            reverseButtons: true // Deixa o botão de cancelar na esquerda (padrão moderno)
        });
    }
}