import bpy
import sys
argv = sys.argv
argv = argv[argv.index("--") + 1:]  # get all args after "--"

# print(engine)
print(argv)
myRenderSetting = {}
myRenderSetting['engine'] 		= argv[1]
myRenderSetting['samples'] 		= argv[3]
myRenderSetting['scene'] 		= argv[5]
myRenderSetting['frame'] 		= argv[7]
myRenderSetting['w'] 			= argv[9]
myRenderSetting['h'] 			= argv[11]
myRenderSetting['outputPath'] 	= argv[13]


renderFilePath = myRenderSetting['outputPath'] + myRenderSetting['frame'] + '.png'
bpy.context.scene.render.engine = myRenderSetting['engine']

if myRenderSetting['engine'] == 'CYCLES':
	bpy.context.scene.cycles.samples = int(myRenderSetting['samples'])

if myRenderSetting['engine'] == 'BLENDER_EEVEE':
	bpy.context.scene.eevee.taa_render_samples = int(myRenderSetting['samples'])


bpy.context.scene.render.filepath = renderFilePath
scene = bpy.data.scenes[myRenderSetting['scene']]
scene.render.resolution_x = int(myRenderSetting['w'])
scene.render.resolution_y = int(myRenderSetting['h'])
scene.render.resolution_percentage = 100



bpy.ops.render.render(write_still = True)

