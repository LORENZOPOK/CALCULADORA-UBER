import SwiftUI
import SwiftData

struct JornadaDetalleView: View {
    let jornada: Jornada
    @State private var editando = false

    var body: some View {
        Form {
            Section("Jornada") {
                LabeledContent(
                    "Fecha",
                    value: jornada.fecha,
                    format: .dateTime.weekday(.wide).day().month(.wide).year()
                )
                LabeledContent("Monto generado", value: Formato.pesos(jornada.montoGenerado))
                LabeledContent("Km recorridos", value: "\(Formato.numero(jornada.kmRecorridos)) km")
                LabeledContent("Tiempo trabajado", value: Formato.duracion(minutos: jornada.minutosTrabajados))
            }

            Section("Combustible") {
                LabeledContent("Rendimiento", value: "\(Formato.numero(jornada.rendimiento, decimales: 2)) km/L")
                LabeledContent("Precio bencina", value: "\(Formato.pesos(jornada.precioBencina))/L")
            }

            SeccionResultados(calculo: jornada.calculo)
        }
        .navigationTitle("Jornada")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            Button("Editar") { editando = true }
        }
        .sheet(isPresented: $editando) {
            JornadaFormView(jornada: jornada)
        }
    }
}

#Preview {
    let container = try! ModelContainer(
        for: Jornada.self,
        configurations: ModelConfiguration(isStoredInMemoryOnly: true)
    )
    let jornada = Jornada(
        fecha: .now,
        montoGenerado: 80_000,
        kmRecorridos: 150,
        minutosTrabajados: 480,
        rendimiento: 12.5,
        precioBencina: 1290
    )
    container.mainContext.insert(jornada)
    return NavigationStack {
        JornadaDetalleView(jornada: jornada)
    }
    .modelContainer(container)
}
