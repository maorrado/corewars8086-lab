import java.nio.file.*;
import java.util.*;
import il.co.codeguru.corewars8086.cpu.*;
import il.co.codeguru.corewars8086.memory.*;

public class BootstrapSmoke {
 static RealModeAddress a(int s,int o){return new RealModeAddress((short)s,(short)o);}
 public static void main(String[] args)throws Exception {
  StringBuilder result=new StringBuilder();
  for(int f=1;f<args.length;f++)for(int place:new int[]{0x400,0x3c00,0x7400,0xb000,0xec00}){
   String file=args[f];RealModeMemoryImpl core=new RealModeMemoryImpl();
   for(int o=0;o<65536;o++)core.writeByte(a(0x1000,o),(byte)0xcc);
   byte[] code=Files.readAllBytes(Paths.get(file));
   for(int o=0;o<code.length;o++)core.writeByte(a(0x1000,place+o),code[o]);
   boolean hasBurst=false,burstChecked=false;
   for(int o=0;o<code.length-1;o++)if((code[o]&255)==0xcd&&(code[o+1]&255)==0x86)hasBurst=true;
   int burstStart=-1;
   if(hasBurst){
    boolean isB=(code[2]&255)==0x8d;
    int high=((place>>>8)/0x3c)*0x3c;
    int pointer=((((high+(isB?0x10:0x2c))&255)<<8)+0xa2);
    burstStart=(pointer+(isB?0x3000:0x2000)-0x50)&65535;
    for(int o=0;o<512;o++)core.writeByte(a(0x1000,(burstStart+o)&65535),(byte)0x90);
   }
   RealModeMemoryRegion arena=new RealModeMemoryRegion(a(0x1000,0),a(0x1000,0xffff));
   RealModeMemoryRegion stack=new RealModeMemoryRegion(a(0x2000,0),a(0x2000,0x800));
   RealModeMemoryRegion shared=new RealModeMemoryRegion(a(0x2100,0),a(0x2100,0x400));
   RestrictedAccessRealModeMemory mem=new RestrictedAccessRealModeMemory(core,new RealModeMemoryRegion[]{arena,stack,shared},new RealModeMemoryRegion[]{arena,stack,shared},new RealModeMemoryRegion[]{arena});
   CpuState s=new CpuState();s.setAX((short)place);s.setIP((short)place);s.setCS((short)0x1000);s.setDS((short)0x1000);s.setES((short)0x2100);s.setSS((short)0x2000);s.setSP((short)0x800);
   s.setBomb1Count((byte)2);s.setBomb2Count((byte)1);
   Cpu cpu=new Cpu(s,mem);int n=0,launches=0,firstBoot=-1,initialRecursive=0,camoCalls=0;String status="alive";
   try{for(;n<20000;n++){
    int op=core.readByte(a(s.getCS(),s.getIP()))&255;
    if(op==0xff&&(core.readByte(a(s.getCS(),(s.getIP()+1)&65535))&255)==0x18){
     camoCalls++;if(s.getSI()!=0)throw new IllegalStateException("camouflaged call requires SI=0");
    }
    if(op==0xab)launches++;
    if(s.getCS()==(short)0xffb&&firstBoot<0){if(op==0xa4)firstBoot=n;else if(op==0xff)initialRecursive++;}
    cpu.nextOpcode();
    if(hasBurst&&!burstChecked&&s.getBomb1Count()==0){
     for(int o=0;o<512;o++)if((core.readByte(a(0x1000,(burstStart+o)&65535))&255)!=0xcc)throw new IllegalStateException("INT86 burst did not write all512 bytes");
     burstChecked=true;
    }
   }}catch(Exception e){status=e.getClass().getSimpleName();}
   String line=String.format(Locale.ROOT,"%s place=%04x status=%s ops=%d launches=%d firstBoot=%d initialRecursive=%d camoCalls=%d burst512=%s csip=%04x:%04x sp=%04x%n",file,place,status,n,launches,firstBoot,initialRecursive,camoCalls,burstChecked,s.getCS()&65535,s.getIP()&65535,s.getSP()&65535);
   result.append(line);System.out.print(line);
  }
  Files.write(Paths.get(args[0]),result.toString().getBytes("UTF-8"));
 }
}
