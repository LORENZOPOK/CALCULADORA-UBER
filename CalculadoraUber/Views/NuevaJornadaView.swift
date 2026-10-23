import SwiftUI
import SwiftData

struct NuevaJornadaView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @AppStorage("ultimoRendimiento") private var ultimoRendimiento: Double = 0
    @AppStorage("ultimoPrecioBencina") private var ultimoPrecioBencina: Int = 0

    @State private var fecha = Date.now
    @State private var montoTexto = ""
    @State private var kmTexto = ""
    @State private var minutosTexto = ""
    @State private var rendimientoTexto = ""
    @State private var precioTexto = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Jornada") {
                    DatePicker("Fecha", selection: $fecha, displayedComponents: .date)
                    campo("Monto generado", texto: $montoTexto, unidad: "CLP", teclado: .numberPad)
                    campo("Km recorridos", texto: $kmTexto, unidad: "km", teclado: .decimalPad)
                    campo("Minutos trabajados", texto: $minutosTexto, unidad: "min", teclado: .numberPad)
                }

                Section {
                    campo("Rendimiento", texto: $rendimientoTexto, unidad: "km/L", teclado: .decimalPad)
                    campo("Precio bencina", texto: $precioTexto, unidad: "CLP/L", teclado: .numberPad)
                } header: {
                    Text("Combustible")
                } footer: {
                    Text("Se recuerdan los últimos valores usados.")
                }

                Section("Resultados") {
                    resultado("Litros usados", calculo.litrosUsados.map { "\(Formato.numero($0, decimales: 2)) L" })
                    resultado("Gasto en bencina", calculo.gastoBencina.map(Formato.pesos))
                    LabeledContent("Ganancia neta") {
                        Text(calculo.gananciaNeta.map(Formato.pesos) ?? "—")
                            .fontWeight(.semibold)
                            .foregroundStyle(Color.ganancia(calculo.gananciaNeta))
                    }
                    resultado("Ganancia por hora", calculo.gananciaPorHora.map { "\(Formato.pesos($0))/h" })
                    resultado("Ganancia por km", calculo.gananciaPorKm.map { "\(Formato.pesos($0))/km" })
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("Nueva jornada")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Guardar", action: guardar)
                        .disabled(!puedeGuardar)
                }
            }
            .onAppear(perform: cargarUltimosValores)
        }
    }

    // MARK: - Datos

    private var monto: Int? { Self.entero(montoTexto) }
    private var km: Double? { Self.decimal(kmTexto) }
    private var minutos: Int? { Self.entero(minutosTexto) }
    private var rendimiento: Double? { Self.decimal(rendimientoTexto) }
    private var precio: Int? { Self.entero(precioTexto) }

    private var calculo: CalculoJornada {
        CalculoJornada(
            montoGenerado: monto,
            kmRecorridos: km,
            minutosTrabajados: minutos,
            rendimiento: rendimiento,
            precioBencina: precio
        )
    }

    private var puedeGuardar: Bool {
        guard monto != nil, let km, let minutos, let rendimiento, let precio else { return false }
        return km > 0 && minutos > 0 && rendimiento > 0 && precio > 0
    }

    private func cargarUltimosValores() {
        if rendimientoTexto.isEmpty && ultimoRendimiento > 0 {
            rendimientoTexto = Formato.numero(ultimoRendimiento, decimales: 2)
        }
        if precioTexto.isEmpty && ultimoPrecioBencina > 0 {
            precioTexto = String(ultimoPrecioBencina)
        }
    }

    private func guardar() {
        guard puedeGuardar, let monto, let km, let minutos, let rendimiento, let precio else { return }
        modelContext.insert(
            Jornada(
                fecha: fecha,
                montoGenerado: monto,
                kmRecorridos: km,
                minutosTrabajados: minutos,
                rendimiento: rendimiento,
                precioBencina: precio
            )
        )
        ultimoRendimiento = rendimiento
        ultimoPrecioBencina = precio
        dismiss()
    }

    // MARK: - Lectura de texto

    /// Entero no negativo; ignora puntos de miles ("12.345").
    private static func entero(_ texto: String) -> Int? {
        let limpio = texto
            .replacingOccurrences(of: ".", with: "")
            .trimmingCharacters(in: .whitespaces)
        guard let valor = Int(limpio), valor >= 0 else { return nil }
        return valor
    }

    /// Decimal no negativo; acepta coma o punto como separador ("12,5").
    private static func decimal(_ texto: String) -> Double? {
        let limpio = texto
            .replacingOccurrences(of: ",", with: ".")
            .trimmingCharacters(in: .whitespaces)
        guard let valor = Double(limpio), valor.isFinite, valor >= 0 else { return nil }
        return valor
    }

    // MARK: - Filas

    private func campo(
        _ titulo: String,
        texto: Binding<String>,
        unidad: String,
        teclado: UIKeyboardType
    ) -> some View {
        LabeledContent(titulo) {
            HStack(spacing: 6) {
                TextField("0", text: texto)
                    .keyboardType(teclado)
                    .multilineTextAlignment(.trailing)
                Text(unidad)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func resultado(_ titulo: String, _ valor: String?) -> some View {
        LabeledContent(titulo, value: valor ?? "—")
    }
}

#Preview {
    NuevaJornadaView()
        .modelContainer(for: Jornada.self, inMemory: true)
}
