import SwiftUI
import SwiftData

@main
struct CalculadoraUberApp: App {
    var body: some Scene {
        WindowGroup {
            JornadasView()
                // Fechas y números siempre en formato chileno.
                .environment(\.locale, Locale(identifier: "es_CL"))
        }
        .modelContainer(for: Jornada.self)
    }
}
