/**
 * Motivos de falha da política (valores estáveis para cliente e assistente).
 * @see {@link validatePasswordPolicy}
 */
export enum PasswordFailureReason {
  FaltaComprimentoMinimo = "falta_comprimento_minimo",
  FaltaDigito = "falta_digito",
  FaltaLetraMinuscula = "falta_letra_minuscula",
  FaltaLetraMaiuscula = "falta_letra_maiuscula",
  FaltaCaractereEspecialPermitido = "falta_caractere_especial_permitido",
  CaracteresRepetidos = "caracteres_repetidos",
  EspacoEmBrancoNaoPermitido = "espaco_em_branco_nao_permitido",
}
