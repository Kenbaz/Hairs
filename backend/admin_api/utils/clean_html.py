from bs4 import BeautifulSoup

def clean_html_for_email(html_content):
    """ Clean HTML content for email """
    if not html_content:
        return html_content
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')

        # Process links
        for link in soup.find_all('a'):
            # Remove Tailwind classes
            if 'class' in link.attrs:
                del link.attrs['class']
            # Keep target="_blank" and add basic styling
            link['style'] = 'color: #2563EB; text-decoration: underline;'
            link['target'] = '_blank'
        
        # Process images
        for img in soup.find_all('img'):
            if 'class' in img.attrs:
                del img.attrs['class']
            img['style'] = 'max-width: 100%; height: auto; border-radius: 0.25rem;'
        
        # Process blockquotes
        for quote in soup.find_all('blockquote'):
            if 'class' in quote.attrs:
                del quote.attrs['class']
            quote['style'] = 'border-left: 4px solid #E5E7EB; margin: 1em 0; padding-left: 1em;'

        # Process headings
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            if 'class' in heading.attrs:
                del heading.attrs['class']

        # Process lists
        for list_tag in soup.find_all(['ul', 'ol']):
            if 'class' in list_tag.attrs:
                del list_tag.attrs['class']
            list_tag['style'] = 'margin: 1em 0; padding-left: 2em;'

        # Convert back to string
        return str(soup)
    except Exception as e:
        print(f"Error cleaning HTML: {str(e)}")
        return html_content  # Return original content if cleaning fails
