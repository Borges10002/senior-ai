import { inject, injectable } from "tsyringe";
import IFeedbackRepository from "@modules/feedback/domain/repositories/IFeedbackRepository";
import IReuniaoRepository from "@modules/reunioes/domain/repositories/IReuniaoRepository";
import IUsuarioRepository from "@modules/usuario/domain/repositories/IUsuarioRepository";
import { PERFIS, perfilDoNivel } from "@modules/usuario/domain/perfil";
import IAssinaturaRepository from "@modules/assinaturas/domain/repositories/IAssinaturaRepository";

export interface ResumoAdmin {
  usuarios: {
    total: number;
    ativos: number;
    inativos: number;
    porPerfil: { nivel: number; nome: string; total: number }[];
  };
  feedbacks: {
    total: number;
    ultimos7Dias: number;
    porTipo: Record<string, number>;
  };
  reunioes: { total: number };
  /** Assinaturas por status (trial, ativa, inadimplente, cancelada). */
  assinaturas: Record<string, number>;
}

/** Números gerais do sistema para o painel administrativo. */
@injectable()
class ResumoAdminUseCase {
  constructor(
    @inject("UsuarioRepository")
    private usuarioRepository: IUsuarioRepository,
    @inject("FeedbackRepository")
    private feedbackRepository: IFeedbackRepository,
    @inject("ReuniaoRepository")
    private reuniaoRepository: IReuniaoRepository,
    @inject("AssinaturaRepository")
    private assinaturaRepository: IAssinaturaRepository,
  ) {}

  async execute(): Promise<ResumoAdmin> {
    const [usuarios, feedbacks, totalReunioes, assinaturas] = await Promise.all([
      this.usuarioRepository.findAll(),
      this.feedbackRepository.findAll(),
      this.reuniaoRepository.countAll(),
      this.assinaturaRepository.resumo(),
    ]);

    const ativos = usuarios.filter((u) => u.ativo !== "N").length;
    const porPerfil = PERFIS.map((p) => ({
      nivel: p.level,
      nome: p.nome,
      total: usuarios.filter((u) => perfilDoNivel(u.nivelacesso).level === p.level).length,
    }));

    const limite = Date.now() - 7 * 86_400_000;
    const porTipo: Record<string, number> = {};
    for (const f of feedbacks) porTipo[f.tipo] = (porTipo[f.tipo] ?? 0) + 1;

    return {
      usuarios: { total: usuarios.length, ativos, inativos: usuarios.length - ativos, porPerfil },
      feedbacks: {
        total: feedbacks.length,
        ultimos7Dias: feedbacks.filter((f) => new Date(f.created_at).getTime() >= limite).length,
        porTipo,
      },
      reunioes: { total: totalReunioes },
      assinaturas,
    };
  }
}

export { ResumoAdminUseCase };
