import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EstatisticasClube } from '../models/estatisticas.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EstatisticasService {
    // A URL vem do seu environment: http://localhost:3000
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    /**
     * Busca as estatísticas filtradas por um clube específico.
     * @param clubeId O ID do clube no banco de dados.
     */
    getEstatisticasClube(clubeId: number): Observable<EstatisticasClube> {
        return this.http.get<EstatisticasClube>(`${this.apiUrl}/clubes/${clubeId}/statistics`);
    }
}