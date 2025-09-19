#!/usr/bin/env python3
import os
import re

base_dir = "/Users/viv/Desktop/wizelfront"

# List of files that contain Loader2
files = [
    "app/components/chat/ChatWidget.jsx",
    "app/components/stores/store-dialog.jsx",
    "app/components/dashboard/sidebar-store-selector.jsx",
    "app/components/dashboard/sidebar.jsx",
    "app/components/dashboard/store-selector-enhanced.jsx",
    "app/register/page.jsx",
    "app/(dashboard)/idea-generator/page.jsx",
    "app/(dashboard)/test-stores/page.jsx",
    "app/(dashboard)/email-builder/page.jsx",
    "app/(dashboard)/store/[storePublicId]/ctas/page.jsx",
    "app/(dashboard)/store/[storePublicId]/shopify-connect/page.jsx",
    "app/(dashboard)/store/[storePublicId]/products/page.jsx",
    "app/(dashboard)/store/[storePublicId]/products/[productId]/page.jsx",
    "app/(dashboard)/store/[storePublicId]/idea-generator/page.jsx",
    "app/(dashboard)/store/[storePublicId]/page.jsx",
    "app/(dashboard)/store/[storePublicId]/email-builder/page.jsx",
    "app/(dashboard)/store/[storePublicId]/users/page.jsx",
    "app/(dashboard)/store/[storePublicId]/klaviyo-connect/page.jsx",
    "app/superuser/test/clickhouse/page.jsx",
]

def process_file(filepath):
    """Process a single file to replace Loader2 with MorphingLoader."""
    full_path = os.path.join(base_dir, filepath)

    if not os.path.exists(full_path):
        print(f"  ✗ File not found: {filepath}")
        return False

    try:
        with open(full_path, 'r') as f:
            content = f.read()

        original_content = content

        # Check if MorphingLoader is already imported
        has_morphing_import = 'MorphingLoader' in content and 'from "@/app/components/ui/loading"' in content

        # Add MorphingLoader import if not present
        if not has_morphing_import and 'Loader2' in content:
            # Find the first import statement
            import_match = re.search(r'^import .*? from', content, re.MULTILINE)
            if import_match:
                # Add MorphingLoader import after the first import
                insert_pos = import_match.end()
                # Find the end of the line
                newline_pos = content.find('\n', insert_pos)
                if newline_pos != -1:
                    content = content[:newline_pos + 1] + 'import MorphingLoader from "@/app/components/ui/loading";\n' + content[newline_pos + 1:]

        # Remove Loader2 from lucide-react imports
        # Handle various import patterns
        content = re.sub(r',\s*Loader2(?=\s*[,}\n])', '', content)
        content = re.sub(r'Loader2\s*,', '', content)
        content = re.sub(r'(?<=[\s{,])Loader2(?=\s*})', '', content)

        # Replace Loader2 component usage with MorphingLoader
        # Handle self-closing tags with various attributes
        content = re.sub(
            r'<Loader2\s+[^>]*?className\s*=\s*["\'][^"\']*["\'][^>]*?/>',
            '<MorphingLoader size="small" showThemeText={false} />',
            content
        )
        content = re.sub(
            r'<Loader2\s*/>',
            '<MorphingLoader size="small" showThemeText={false} />',
            content
        )
        content = re.sub(
            r'<Loader2/>',
            '<MorphingLoader size="small" showThemeText={false} />',
            content
        )

        if content != original_content:
            with open(full_path, 'w') as f:
                f.write(content)
            print(f"  ✓ Processed {filepath}")
            return True
        else:
            print(f"  - No changes needed for {filepath}")
            return False

    except Exception as e:
        print(f"  ✗ Error processing {filepath}: {e}")
        return False

def main():
    print("Starting Loader2 replacement process...")
    print()

    success_count = 0
    for filepath in files:
        print(f"Processing: {filepath}")
        if process_file(filepath):
            success_count += 1

    print()
    print(f"Replacement complete! Successfully processed {success_count} files.")

if __name__ == "__main__":
    main()