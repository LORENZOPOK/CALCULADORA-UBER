import SwiftUI

/// Sección de formulario con los resultados calculados de una jornada.
struct SeccionResultados: View {
    let calculo: CalculoJornada

    var body: some View {
        Section("Resultados") {
            fila("Litros usados", calculo.litrosUsados.map { "\(Formato.numero($0, decimales: 2)) L" })
            fila("Gasto en bencina", calculo.gastoBencina.map(Formato.pesos))
            LabeledContent("Ganancia neta") {
                Text(calculo.gananciaNeta.map(Formato.pesos) ?? "—")
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.ganancia(calculo.gananciaNeta))
            }
            fila("Ganancia por hora", calculo.gananciaPorHora.map { "\(Formato.pesos($0))/h" })
            fila("Ganancia por km", calculo.gananciaPorKm.map { "\(Formato.pesos($0))/km" })
        }
    }

    private func fila(_ titulo: String, _ valor: String?) -> some View {
        LabeledContent(titulo, value: valor ?? "—")
    }
}
