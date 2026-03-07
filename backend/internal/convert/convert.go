package convert

import (
	"strings"

	"github.com/JohannesKaufmann/html-to-markdown/v2/converter"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/base"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/commonmark"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/table"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
)

// MdToHtml converts markdown to HTML
func MdToHtml(md string) (string, error) {
	var buf strings.Builder
	mdParser := goldmark.New(
		goldmark.WithExtensions(extension.Table),
	)
	if err := mdParser.Convert([]byte(md), &buf); err != nil {
		return "", err
	}
	return buf.String(), nil
}

// HtmlToMd converts HTML to markdown
func HtmlToMd(html string) (string, error) {
	conv := converter.NewConverter(
		converter.WithPlugins(
			base.NewBasePlugin(),
			commonmark.NewCommonmarkPlugin(),
			table.NewTablePlugin(),
		),
		converter.WithEscapeMode(converter.EscapeModeDisabled),
	)
	return conv.ConvertString(html)
}
