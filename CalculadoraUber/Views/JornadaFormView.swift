import SwiftUI
import SwiftData

/// Formulario para crear una jornada nueva o editar una existente.
struct JornadaFormView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @AppStorage("ultimoRendimiento") private var ultimoRendimiento: Double = 0
    @AppStorage("ultimoPrecioBencina") private var ultimoPrecioBencina: Int = 0

    /// Jornada que se edita; `nil` al crear una nueva.
    private let jornada: Jornada?

    @State private var fecha: Date
    @State private var montoTexto: String
    @State private var kmTexto: String
    @State private var minutosTexto: String
    @State private var rendimientoTexto: String
    @State private var precioTexto: String

    init(jornada: Jornada? = nil) {
        self.jornada = jornada
        _fecha = State(initialValue: jornada?.fecha ?? .now)
        _montoTexto = State(initialValue: jornada.map { String($0.montoGenerado) } ?? "")
        _kmTexto = State(initialValue: jornada.map { Self.texto($0.kmRecorridos) } ?? "")
        _minutosTexto = State(initialValue: jornada.map { String($0.minutosTrabajados) } ?? "")
        _rendimientoTexto = State(initialValue: jornada.map { Self.texto($0.rendimiento) } ?? "")
        _precioTexto = State(initialValue: jornada.map { String($0.precioBencina) } ?? "")
    }

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
                    if jornada == nil {
                        Text("Se recuerdan los últimos valores usados.")
                    }
                }

                SeccionResultados(calculo: calculo)
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle(jornada == nil ? "Nueva jornada" : "Editar jornada")
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

    /// Al crear una jornada, propone el último rendimiento y precio usados.
    private func cargarUltimosValores() {
        guard jornada == nil else { return }
        if rendimientoTexto.isEmpty && ultimoRendimiento > 0 {
            rendimientoTexto = Self.texto(ultimoRendimiento)
        }
        if precioTexto.isEmpty && ultimoPrecioBencina > 0 {
            precioTexto = String(ultimoPrecioBencina)
        }
    }

    private func guardar() {
        guard puedeGuardar, let monto, let km, let minutos, let rendimiento, let precio else { return }
        if let jornada {
            jornada.fecha = fecha
            jornada.montoGenerado = monto
            jornada.kmRecorridos = km
            jornada.minutosTrabajados = minutos
            jornada.rendimiento = rendimiento
            jornada.precioBencina = precio
        } else {
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
        }
        dismiss()
    }

    // MARK: - Lectura de texto

    /// Texto editable para un decimal, sin perder precisión al volver a leerlo.
    private static func texto(_ valor: Double) -> String {
        Formato.numero(valor, decimales: 6)
    }

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
}

#Preview {
    JornadaFormView()
        .modelContainer(for: Jornada.self, inMemory: true)
}
