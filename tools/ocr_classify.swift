import AppKit
import Foundation
import Vision

func cgImage(for url: URL) -> CGImage? {
    guard let image = NSImage(contentsOf: url) else { return nil }
    var rect = CGRect(origin: .zero, size: image.size)
    return image.cgImage(forProposedRect: &rect, context: nil, hints: nil)
}

func classify(_ text: String) -> (String, Int, Int) {
    var cyrillic = 0
    var latin = 0

    for scalar in text.unicodeScalars {
        let value = scalar.value
        if (0x0400...0x04FF).contains(value) {
            cyrillic += 1
        } else if (0x0041...0x005A).contains(value) || (0x0061...0x007A).contains(value) {
            latin += 1
        }
    }

    if cyrillic >= 8 && cyrillic >= latin / 5 {
        return ("ru", cyrillic, latin)
    }

    return ("en", cyrillic, latin)
}

let arguments = CommandLine.arguments.dropFirst()
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["ru-RU", "en-US"]
request.usesLanguageCorrection = true

for path in arguments {
    let url = URL(fileURLWithPath: path)
    guard let image = cgImage(for: url) else {
        print("\(url.lastPathComponent)\tunknown\t0\t0\t")
        continue
    }

    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    do {
        try handler.perform([request])
        let observations = request.results ?? []
        let text = observations
            .compactMap { $0.topCandidates(1).first?.string }
            .joined(separator: " ")
        let result = classify(text)
        let snippet = text
            .replacingOccurrences(of: "\t", with: " ")
            .replacingOccurrences(of: "\n", with: " ")
            .prefix(180)
        print("\(url.lastPathComponent)\t\(result.0)\t\(result.1)\t\(result.2)\t\(snippet)")
    } catch {
        print("\(url.lastPathComponent)\tunknown\t0\t0\t\(error.localizedDescription)")
    }
}
