SYSNAM   = observers/ptolemy
VERNUM   = $(shell basename `pwd`)
BUILDDIR = build
BACKEND  = backend
RELDIR   = /www/$(SYSNAM)/$(VERNUM)

# Run the local env script
npm:

NPMOUT := $(shell ./env)

ifeq ($(NPMOUT), yes)
install:
	@echo "rsync -abvhHS --recursive $(BUILDDIR)/ /$(RELDIR)/"
	rsync -abvhHS --recursive $(BUILDDIR)/ /$(RELDIR)/
	# Temporary
	rsync -abvhHS --recursive $(BACKEND) /$(RELDIR)/
	#
	cd $(RELDIR)/..; rm rel; ln -s $(VERNUM) rel;
else
install:
	@echo "Error with npm build"
endif
