import SwiftUI

enum Formato {
    private static let chile = Locale(identifier: "es_CL")

    /// Pesos chilenos con punto de miles: "$12.345" o "-$12.345".
    static func pesos(_ valor: Int) -> String {
        let digitos = Array(String(valor.magnitude))
        var miles = ""
        for (posicion, digito) in digitos.enumerated() {
            if posicion > 0 && (digitos.count - posicion) % 3 == 0 {
                miles.append(".")
            }
            miles.append(digito)
        }
        return (valor < 0 ? "-$" : "$") + miles
    }

    /// Número con coma decimal y hasta `decimales` decimales: "12,5".
    static func numero(_ valor: Double, decimales: Int = 1) -> String {
        valor.formatted(
            .number
                .grouping(.never)
                .precision(.fractionLength(0...decimales))
                .locale(chile)
        )
    }

    /// Duración legible: "45 min", "8 h", "8 h 30 min".
    static func duracion(minutos: Int) -> String {
        let horas = minutos / 60
        let resto = minutos % 60
        if horas == 0 { return "\(resto) min" }
        if resto == 0 { return "\(horas) h" }
        return "\(horas) h \(resto) min"
    }
}

extension Color {
    /// Verde si hay ganancia, rojo si hay pérdida.
    static func ganancia(_ valor: Int?) -> Color {
        guard let valor, valor != 0 else { return .secondary }
        return valor > 0 ? .green : .red
    }
}
