import SwiftUI
import SwiftData

struct JornadasView: View {
    @Query(sort: \Jornada.fecha, order: .reverse) private var jornadas: [Jornada]
    @State private var mostrandoNuevaJornada = false

    var body: some View {
        NavigationStack {
            List(jornadas) { jornada in
                JornadaFila(jornada: jornada)
            }
            .overlay {
                if jornadas.isEmpty {
                    ContentUnavailableView(
                        "Sin jornadas",
                        systemImage: "car",
                        description: Text("Toca + para registrar tu primera jornada.")
                    )
                }
            }
            .navigationTitle("Jornadas")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Nueva jornada", systemImage: "plus") {
                        mostrandoNuevaJornada = true
                    }
                }
            }
            .sheet(isPresented: $mostrandoNuevaJornada) {
                NuevaJornadaView()
            }
        }
    }
}

private struct JornadaFila: View {
    let jornada: Jornada

    var body: some View {
        let gananciaNeta = jornada.calculo.gananciaNeta

        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(jornada.fecha, format: .dateTime.weekday(.abbreviated).day().month(.abbreviated).year())
                    .font(.headline)
                Spacer()
                Text(gananciaNeta.map(Formato.pesos) ?? "—")
                    .font(.headline)
                    .foregroundStyle(Color.ganancia(gananciaNeta))
            }
            Text("Generado \(Formato.pesos(jornada.montoGenerado)) · \(Formato.numero(jornada.kmRecorridos)) km · \(Formato.duracion(minutos: jornada.minutosTrabajados))")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    JornadasView()
        .modelContainer(for: Jornada.self, inMemory: true)
}
