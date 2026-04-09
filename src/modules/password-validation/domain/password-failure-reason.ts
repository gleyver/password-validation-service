/**
 * Códigos estáveis (ASCII) emitidos por {@link validatePasswordPolicy} quando a senha é inválida.
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
