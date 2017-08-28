# Simple bash script to build the Gnome Shell extension

echo "Zipping the extension..."
zip -r expressvpn_manager@faidoc.zip . -x *.git*

echo "Done building."
