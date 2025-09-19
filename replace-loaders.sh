#!/bin/bash

# List of files that contain Loader2
files=(
  "app/superuser/test/clickhouse/page.jsx"
  "app/components/chat/ChatWidget.jsx"
  "app/components/stores/store-dialog.jsx"
  "app/components/dashboard/sidebar-store-selector.jsx"
  "app/components/dashboard/sidebar.jsx"
  "app/components/dashboard/store-selector-enhanced.jsx"
  "app/register/page.jsx"
  "app/(dashboard)/idea-generator/page.jsx"
  "app/(dashboard)/stores/page.jsx"
  "app/(dashboard)/test-stores/page.jsx"
  "app/(dashboard)/email-builder/page.jsx"
  "app/(dashboard)/store/[storePublicId]/ctas/page.jsx"
  "app/(dashboard)/store/[storePublicId]/shopify-connect/page.jsx"
  "app/(dashboard)/store/[storePublicId]/products/page.jsx"
  "app/(dashboard)/store/[storePublicId]/products/[productId]/page.jsx"
  "app/(dashboard)/store/[storePublicId]/idea-generator/page.jsx"
  "app/(dashboard)/store/[storePublicId]/page.jsx"
  "app/(dashboard)/store/[storePublicId]/email-builder/page.jsx"
  "app/(dashboard)/store/[storePublicId]/users/page.jsx"
  "app/(dashboard)/store/[storePublicId]/klaviyo-connect/page.jsx"
)

echo "Starting Loader2 replacement process..."

for file in "${files[@]}"; do
  filepath="/Users/viv/Desktop/wizelfront/$file"
  if [ -f "$filepath" ]; then
    echo "Processing: $file"

    # Check if file already has MorphingLoader import
    if ! grep -q "MorphingLoader" "$filepath"; then
      # Add MorphingLoader import after the first import statement if not present
      sed -i '' '/^import.*from/{
        /MorphingLoader/!{
          a\
import MorphingLoader from "@/app/components/ui/loading";
          q
        }
      }' "$filepath"
    fi

    # Remove Loader2 from lucide-react imports
    sed -i '' 's/, Loader2//g; s/Loader2, //g; s/ Loader2 //g' "$filepath"

    # Replace Loader2 usage with MorphingLoader
    sed -i '' 's/<Loader2[^>]*\/>/\<MorphingLoader size="small" showThemeText={false} \/\>/g' "$filepath"

    # Handle multiline Loader2 components
    perl -i -pe 's/<Loader2\s+className="[^"]*"\s*\/>/\<MorphingLoader size="small" showThemeText={false} \/\>/g' "$filepath"

    echo "  ✓ Processed $file"
  else
    echo "  ✗ File not found: $file"
  fi
done

echo "Replacement complete!"