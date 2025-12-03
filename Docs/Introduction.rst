**What is LocaliView?**
===================== 
Localiview  is a web application developed by by the NeSys laboratory at University of Oslo with the aim of facilitating brain atlas-based analysis and
integration of experimental data and knowledge about the rodent brain.
LocaliView is composed of a suite of apps allowing users to register their brain section images to a reference atlas and annotate the registered image sections in order to extract point coordinates of objects of interest like cell somas, aggregated proteins or connection fibers in tract -tracing experiments for example.


.. image:: Docs/images/LocaliView UI.png
   :width: 9.12083in
   :height: 5.44028in
   

*Web applications*:
  - CreateZoom for transformation of brain section images to DZI pyramid format allowing annotation of high resolution images
  - WebAlign and WebWarp for registration to a reference atlas in two steps, affine and non-linear
  - LocaliZoom for annotation of the images and creation of point cloud files
  - MeshView for visualisation of the point clouds in the 3D reference atlas


**Which atlases are supported?**
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
1. Allen Mouse Brain Atlas Common Coordinate Framework version 3 (2015 and 2017) (CCFv3) (Wang et al. 2020. Cell, https://doi.org/10.1016/j.cell.2020.04.007. Epub 2020 May 7; RRID:JCR_020999 and RRID:JRC_021000) 
2. Waxholm Atlas of the Sprague Dawley rat, version 4 (WHS rat brain atlas) (Kleven et al. Nat Methods, 2020. https://doi.org/10.1038/s41592-023-02034-3; RRID:SCR_017124)


**What is the output of LocaliView?**
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Visualisation of a point cloud file file (JSON format) containing the coordinates of objects segmented out from section images in atlas space and atlas meshes. By using the "screenshot" button, users can obtain a png image file of the main window field of view.

- The configuration of the current view using the "configuration" button can be exported and reused 

