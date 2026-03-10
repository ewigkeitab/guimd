package backend

import (
	"testing"
)

func TestMdToHtml(t *testing.T) {
	app := NewApp()
	md := "# Hello World\n\nThis is **bold**."
	expected := "<h1>Hello World</h1>\n<p>This is <strong>bold</strong>.</p>\n"

	html, err := app.MdToHtml(md)
	if err != nil {
		t.Fatalf("MdToHtml failed: %v", err)
	}

	if html != expected {
		t.Errorf("expected:\n%s\ngot:\n%s", expected, html)
	}
}

func TestHtmlToMd(t *testing.T) {
	app := NewApp()
	html := "<h1>Hello World</h1>\n<p>This is <strong>bold</strong>.</p>"
	// html-to-markdown v2 might produce slightly different output than the input md
	// but it should be functionally equivalent.

	md, err := app.HtmlToMd(html)
	if err != nil {
		t.Fatalf("HtmlToMd failed: %v", err)
	}

	expected := "# Hello World\n\nThis is **bold**."
	// Note: exact spacing might vary depending on the library settings
	if md != expected {
		// If fails, I might need to normalize or check for functional equivalence
		t.Errorf("expected:\n%s\ngot:\n%s", expected, md)
	}
}
